import cv2
import os
import numpy as np
from PIL import Image
import pandas as pd
import datetime
import time
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import io

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
TRAINING_IMAGE_DIR = BASE_DIR / "TrainingImage"
TRAINING_LABEL_DIR = BASE_DIR / "TrainingImageLabel"
HAAR_CASCADE_PATH = BASE_DIR / "haarcascade_frontalface_default.xml"
ENROLLMENT_MAP_PATH = TRAINING_LABEL_DIR / "enrollment_map.json"

TRAINING_IMAGE_DIR.mkdir(exist_ok=True)
TRAINING_LABEL_DIR.mkdir(exist_ok=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class FaceRecognitionService:
    def __init__(self):
        self.detector = cv2.CascadeClassifier(str(HAAR_CASCADE_PATH))
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.model_path = TRAINING_LABEL_DIR / "Trainner.yml"
        
    def capture_images(self, enrollment: str, name: str, num_images: int = 30) -> dict:
        if not supabase:
            return {"success": False, "message": "Supabase not configured"}
        
        cam = cv2.VideoCapture(0)
        if not cam.isOpened():
            return {"success": False, "message": "Cannot access camera"}
        
        sample_num = 0
        uploaded_to_supabase = 0
        start_capture_time = time.time()
        timeout = 30 # 30 seconds timeout for entire capture process
        last_face_detected_time = time.time()
        
        while sample_num < num_images:
            if time.time() - start_capture_time > timeout:
                cam.release()
                return {"success": False, "message": "Capture timeout. Please ensure your face is visible and well-lit."}
            
            if time.time() - last_face_detected_time > 10: # 10 seconds without a single face
                cam.release()
                return {"success": False, "message": "No face detected for 10 seconds. Please look directly at the camera."}

            ret, img = cam.read()
            if not ret:
                continue
                
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Using more robust parameters for face detection
            faces = self.detector.detectMultiScale(gray, 1.2, 5)
            
            if len(faces) > 0:
                last_face_detected_time = time.time()

            for (x, y, w, h) in faces:
                sample_num += 1
                img_name = f"{name}.{enrollment}.{sample_num}.jpg"
                face_img = gray[y:y+h, x:x+w]
                
                img_path = TRAINING_IMAGE_DIR / img_name
                cv2.imwrite(str(img_path), face_img)
                
                try:
                    _, buffer = cv2.imencode('.jpg', face_img)
                    img_bytes = buffer.tobytes()
                    storage_path = f"{enrollment}/{img_name}"
                    try:
                        supabase.storage.from_("training-images").remove([storage_path])
                    except:
                        pass
                    supabase.storage.from_("training-images").upload(
                        path=storage_path,
                        file=img_bytes,
                        file_options={"content-type": "image/jpeg"}
                    )
                    uploaded_to_supabase += 1
                except Exception as e:
                    print(f"Supabase upload error: {e}")
                
                if sample_num >= num_images:
                    break
        
        cam.release()
        
        return {
            "success": True,
            "message": f"Captured {sample_num} images for {name}",
            "enrollment": enrollment,
            "name": name,
            "images_count": sample_num,
            "uploaded_to_supabase": uploaded_to_supabase
        }
    
    def train_model(self) -> dict:
        image_paths = [str(f) for f in TRAINING_IMAGE_DIR.glob("*.jpg")]
        
        if not image_paths:
            return {"success": False, "message": "No training images found"}
        
        face_samples = []
        ids = []
        enrollment_to_id = {}
        id_to_enrollment = {}
        next_id = 1
        
        for image_path in image_paths:
            pil_image = Image.open(image_path).convert('L')
            image_np = np.array(pil_image, 'uint8')
            
            try:
                filename = os.path.split(image_path)[-1]
                enrollment = filename.split(".")[1]
            except (IndexError, ValueError):
                continue
            
            if enrollment not in enrollment_to_id:
                enrollment_to_id[enrollment] = next_id
                id_to_enrollment[next_id] = enrollment
                next_id += 1
            
            numeric_id = enrollment_to_id[enrollment]
            
            # Since images are already cropped to faces during capture,
            # we can use the whole image or try to detect again with very lenient parameters
            face_samples.append(image_np)
            ids.append(numeric_id)
        
        if not face_samples:
            return {"success": False, "message": "No faces detected in training images"}
        
        self.recognizer.train(face_samples, np.array(ids))
        self.recognizer.save(str(self.model_path))
        
        with open(ENROLLMENT_MAP_PATH, 'w') as f:
            json.dump({"id_to_enrollment": {str(k): v for k, v in id_to_enrollment.items()}}, f)
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "faces_count": len(face_samples),
            "unique_ids": len(set(ids)),
            "enrollments": list(enrollment_to_id.keys())
        }
    
    def recognize_and_mark_attendance(self, subject: str, duration: int = 30) -> dict:
        if not supabase:
            return {"success": False, "message": "Supabase not configured"}
        
        if not self.model_path.exists():
            return {"success": False, "message": "Model not trained. Please train first."}
        
        if not ENROLLMENT_MAP_PATH.exists():
            return {"success": False, "message": "Enrollment mapping not found. Please retrain the model."}
        
        self.recognizer.read(str(self.model_path))
        
        with open(ENROLLMENT_MAP_PATH, 'r') as f:
            mapping = json.load(f)
            id_to_enrollment = mapping.get("id_to_enrollment", {})
        
        result = supabase.table("students").select("*").execute()
        if not result.data:
            return {"success": False, "message": "No student details found"}
        
        students_df = pd.DataFrame(result.data)
        
        cam = cv2.VideoCapture(0)
        if not cam.isOpened():
            return {"success": False, "message": "Cannot access camera"}
        
        recognized = []
        recognized_ids = set()
        
        start_time = time.time()
        end_time = start_time + duration
        
        while time.time() < end_time:
            ret, img = cam.read()
            if not ret:
                continue
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = self.detector.detectMultiScale(gray, 1.1, 5)
            
            for (x, y, w, h) in faces:
                face_id, conf = self.recognizer.predict(gray[y:y+h, x:x+w])

                if conf < 70 and face_id not in recognized_ids:
                    recognized_ids.add(face_id)
                    ts = time.time()
                    date = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d')
                    time_str = datetime.datetime.fromtimestamp(ts).strftime('%H:%M:%S')

                    enrollment_str = id_to_enrollment.get(str(face_id), str(face_id))
                    name_match = students_df.loc[students_df['enrollment'] == enrollment_str]['name'].values
                    name = name_match[0] if len(name_match) > 0 else "Unknown"

                    recognized.append({
                        'enrollment': enrollment_str,
                        'name': name,
                        'date': date,
                        'time': time_str
                    })
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cam.release()
        
        return {
            "success": True,
            "message": f"Attendance marked for {len(recognized)} students",
            "subject": subject,
            "recognized": recognized
        }
    
    def get_students(self) -> dict:
        if not supabase:
            return {"success": False, "message": "Supabase not configured"}
        
        result = supabase.table("students").select("*").order("registered_at", desc=True).execute()
        students = [{"Enrollment": s["enrollment"], "Name": s["name"], "Date": str(s["registered_at"])[:10], "Time": str(s["registered_at"])[11:19]} for s in result.data]
        return {"success": True, "students": students, "count": len(students)}
    
    def get_attendance_records(self, subject: str = None) -> dict:
        if not supabase:
            return {"success": False, "message": "Supabase not configured"}
        
        from collections import defaultdict
        query = supabase.table("attendance").select("*").order("created_at", desc=True)
        if subject:
            query = query.eq("subject", subject)
        result = query.execute()
        
        grouped = defaultdict(list)
        for r in result.data:
            key = f"{r['subject']}_{r['date']}"
            grouped[key].append({
                "Enrollment": r["enrollment"],
                "Name": r["name"],
                "Date": str(r["date"]),
                "Time": str(r["time"])
            })
        
        attendance_files = []
        for key, records in grouped.items():
            parts = key.split("_")
            attendance_files.append({
                "file": f"Attendance_{key}.csv",
                "subject": parts[0],
                "date": parts[1] if len(parts) > 1 else "",
                "records": records
            })
        
        return {"success": True, "attendance_files": attendance_files}


face_service = FaceRecognitionService()
