from fastapi import FastAPI, HTTPException, Body, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Annotated, Optional, List
import sys
import os
from pathlib import Path
import shutil
import datetime
import time
from dotenv import load_dotenv
from supabase import create_client, Client
import psycopg2
import json

load_dotenv()

sys.path.insert(0, str(Path(__file__).resolve().parent))

from services.face_recognition_service import face_service

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def init_database_schema():
    if not DATABASE_URL:
        print("DATABASE_URL not set, skipping schema initialization")
        return
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Checking and initializing database schema...")
        
        # Create students table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                enrollment VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        
        # Create subjects table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        
        # Create attendance table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                enrollment VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        
        # Create users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                name VARCHAR(255),
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        
        # Add name column to users if it doesn't exist
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);")

        # Create instructor_subjects table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS instructor_subjects (
                id SERIAL PRIMARY KEY,
                instructor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(instructor_id, subject_id)
            );
        """)
        
        # Ensure admin user exists
        cur.execute("""
            INSERT INTO users (username, password_hash, role, name) 
            VALUES ('admin', 'admin123', 'admin', 'System Administrator')
            ON CONFLICT (username) DO NOTHING;
        """)
        
        conn.commit()
        print("Database schema check/initialization completed successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Database schema initialization error: {e}")


def init_storage_bucket():
    if not supabase:
        return
    
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if "training-images" not in bucket_names:
            print("Creating training-images storage bucket...")
            supabase.storage.create_bucket("training-images", options={"public": True})
            print("Storage bucket created successfully!")
        else:
            print("Storage bucket already exists")
    except Exception as e:
        print(f"Storage bucket initialization error: {e}")


init_database_schema()
init_storage_bucket()

app = FastAPI(
    title="Face Recognition Attendance API",
    description="API for Face Recognition Based Attendance Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Global error: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

class StudentRequest(BaseModel):
    enrollment: str
    name: str
    num_images: Optional[int] = 45
    email: Optional[str] = None
    phone: Optional[str] = None

class AttendanceRequest(BaseModel):
    subject: str
    duration: Optional[int] = 30

class LoginRequest(BaseModel):
    username: str
    password: str

class InstructorAddRequest(BaseModel):
    name: str
    email: str
    password: str
    subjects: List[str]  # List of subject names

class EmailRequest(BaseModel):
    subject: str
    date: str
    recipient_email: str


@app.get("/")
async def root():
    return {"message": "Face Recognition Attendance API", "version": "1.0.0", "database": "supabase" if supabase else "local"}


@app.get("/health")
async def health():
    return {"status": "healthy", "supabase_connected": supabase is not None}


@app.post("/api/students/capture")
async def capture_student_images(request: StudentRequest):
    result = face_service.capture_images(
        enrollment=request.enrollment,
        name=request.name,
        num_images=request.num_images
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    if supabase:
        try:
            existing = supabase.table("students").select("*").eq("enrollment", request.enrollment).execute()
            if not existing.data:
                supabase.table("students").insert({
                    "enrollment": request.enrollment,
                    "name": request.name,
                    "email": request.email,
                    "phone": request.phone
                }).execute()
        except Exception as e:
            print(f"Supabase error: {e}")
    
    return result
    
@app.post("/api/students/capture-frame")
async def capture_frame(
    enrollment: Annotated[str, Form()],
    name: Annotated[str, Form()],
    sample_num: Annotated[str, Form()],
    file: UploadFile
):
    print(f"Received frame for {enrollment} (sample {sample_num})")
    try:
        s_num = int(sample_num)
    except:
        s_num = 0
    image_bytes = await file.read()
    result = face_service.process_training_frame(
        image_bytes=image_bytes,
        enrollment=enrollment,
        name=name,
        sample_num=s_num
    )
    return result



@app.post("/api/model/train")
async def train_model():
    result = face_service.train_model()
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/api/attendance/mark")
async def mark_attendance(request: AttendanceRequest):
    result = face_service.recognize_and_mark_attendance(
        subject=request.subject,
        duration=request.duration
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    print(f"[DEBUG] Recognition result: {result}")
    print(f"[DEBUG] Supabase configured: {supabase is not None}")
    print(f"[DEBUG] Recognized list: {result.get('recognized')}")
    
    return result

@app.post("/api/attendance/recognize-frame")
async def recognize_frame(
    subject: Annotated[str, Form()],
    file: UploadFile
):
    print(f"Received recognition frame for subject: {subject}")
    image_bytes = await file.read()
    result = face_service.process_recognition_frame(
        image_bytes=image_bytes,
        subject=subject
    )
    return result



@app.get("/api/students")
async def get_students():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    result = supabase.table("students").select("*").order("registered_at", desc=True).execute()
    students = [{"Enrollment": s["enrollment"], "Name": s["name"], "Date": str(s["registered_at"])[:10], "Time": str(s["registered_at"])[11:19]} for s in result.data]
    return {"success": True, "students": students, "count": len(students)}


@app.delete("/api/students/{enrollment}")
async def delete_student(enrollment: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    supabase.table("attendance").delete().eq("enrollment", enrollment).execute()
    supabase.table("students").delete().eq("enrollment", enrollment).execute()
    
    try:
        files = supabase.storage.from_("training-images").list(enrollment)
        if files:
            paths = [f"{enrollment}/{f['name']}" for f in files]
            supabase.storage.from_("training-images").remove(paths)
    except Exception as e:
        print(f"Storage cleanup error: {e}")
    
    images_dir = Path(__file__).parent / "TrainingImage" / enrollment
    if images_dir.exists():
        shutil.rmtree(images_dir)
    
    for img in (Path(__file__).parent / "TrainingImage").glob(f"*.{enrollment}.*"):
        img.unlink()
    
    return {"success": True, "message": f"Student {enrollment} deleted successfully"}


@app.get("/api/attendance")
async def get_attendance(subject: Optional[str] = None):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
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


@app.get("/api/subjects")
async def get_subjects():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    result = supabase.table("subjects").select("*").execute()
    return {"success": True, "subjects": result.data}


@app.post("/api/admin/instructors")
async def add_instructor(request: InstructorAddRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    print(f"[DEBUG] Adding instructor: {request.name}, subjects: {request.subjects}")
    
    # Check if user already exists
    existing = supabase.table("users").select("*").eq("username", request.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Instructor with this email already exists")
    
    # Create user
    user_result = supabase.table("users").insert({
        "username": request.email,
        "email": request.email,
        "password_hash": request.password,
        "name": request.name,
        "role": "instructor"
    }).execute()
    
    if not user_result.data:
        # Retry with explicit select if data is empty
        user_result = supabase.table("users").select("*").eq("username", request.email).execute()
        if not user_result.data:
            raise HTTPException(status_code=500, detail="Failed to create instructor user")
    
    instructor_id = user_result.data[0]["id"]
    print(f"[DEBUG] Created instructor ID: {instructor_id}")
    
    # Link subjects
    for subject_name in request.subjects:
        subject_name = subject_name.strip()
        if not subject_name:
            continue
            
        # Get or create subject (case-insensitive check)
        subject_result = supabase.table("subjects").select("id").ilike("name", subject_name).execute()
        
        subject_id = None
        if not subject_result.data:
            print(f"[DEBUG] Creating new subject: {subject_name}")
            # Create subject if it doesn't exist
            new_sub = supabase.table("subjects").insert({"name": subject_name}).execute()
            if new_sub.data:
                subject_id = new_sub.data[0]["id"]
            else:
                # Fallback: select it again
                new_sub = supabase.table("subjects").select("id").eq("name", subject_name).execute()
                if new_sub.data:
                    subject_id = new_sub.data[0]["id"]
        else:
            subject_id = subject_result.data[0]["id"]
            
        if subject_id:
            print(f"[DEBUG] Linking instructor {instructor_id} to subject {subject_id} ({subject_name})")
            supabase.table("instructor_subjects").insert({
                "instructor_id": instructor_id,
                "subject_id": subject_id
            }).execute()
        else:
            print(f"[WARNING] Could not get subject_id for {subject_name}")
            
    return {"success": True, "message": f"Instructor {request.name} added successfully"}


@app.get("/api/admin/instructors")
async def get_instructors():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    result = supabase.table("users").select("id, name, email, role").eq("role", "instructor").execute()
    return {"success": True, "instructors": result.data}


@app.delete("/api/admin/instructors/{instructor_id}")
async def delete_instructor(instructor_id: int):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # Check if user exists and is an instructor
    existing = supabase.table("users").select("*").eq("id", instructor_id).eq("role", "instructor").execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Instructor not found")
    
    # Delete instructor (cascade will handle instructor_subjects)
    supabase.table("users").delete().eq("id", instructor_id).execute()
    
    return {"success": True, "message": "Instructor deleted successfully"}


@app.get("/api/admin/instructors/{instructor_id}/details")
async def get_instructor_details(instructor_id: int):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # Get instructor info
    user_result = supabase.table("users").select("id, name, email").eq("id", instructor_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="Instructor not found")
    
    instructor = user_result.data[0]
    
    # Get assigned subjects
    subjects_result = supabase.table("instructor_subjects").select("subjects(name)").eq("instructor_id", instructor_id).execute()
    assigned_subjects = [s["subjects"]["name"] for s in subjects_result.data]
    
    # Get attendance for those subjects
    attendance_records = []
    if assigned_subjects:
        attendance_result = supabase.table("attendance").select("*").in_("subject", assigned_subjects).execute()
        attendance_records = attendance_result.data
        
    return {
        "success": True, 
        "instructor": instructor,
        "subjects": assigned_subjects,
        "attendance": attendance_records
    }


@app.get("/api/instructor/subjects")
async def get_instructor_subjects(email: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # Use email or username to find user
    user_result = supabase.table("users").select("id").or_(f"email.eq.{email},username.eq.{email}").execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="Instructor not found")
    
    instructor_id = user_result.data[0]["id"]
    
    # Get assigned subjects with join
    try:
        subjects_result = supabase.table("instructor_subjects").select("subjects(name)").eq("instructor_id", instructor_id).execute()
        assigned_subjects = [s["subjects"]["name"] for s in subjects_result.data if s.get("subjects")]
        return {"success": True, "subjects": assigned_subjects}
    except Exception as e:
        print(f"Error fetching instructor subjects: {e}")
        # Fallback if join fails: get subject IDs first
        sub_ids_result = supabase.table("instructor_subjects").select("subject_id").eq("instructor_id", instructor_id).execute()
        if not sub_ids_result.data:
            return {"success": True, "subjects": []}
        
        ids = [s["subject_id"] for s in sub_ids_result.data]
        names_result = supabase.table("subjects").select("name").in_("id", ids).execute()
        assigned_subjects = [s["name"] for s in names_result.data]
        return {"success": True, "subjects": assigned_subjects}


@app.post("/api/auth/login")
async def login(request: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    result = supabase.table("users").select("*").eq("username", request.username).execute()
    if result.data:
        user = result.data[0]
        if user["password_hash"] == request.password:
            return {
                "success": True, 
                "message": "Login successful", 
                "role": user["role"], 
                "email": user.get("email"),
                "name": user.get("name")
            }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/api/email/send-attendance")
async def send_attendance_email(request: EmailRequest):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    
    if not all([smtp_host, smtp_user, smtp_pass]):
        raise HTTPException(status_code=500, detail="SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.")
    
    result = supabase.table("attendance").select("*").eq("subject", request.subject).eq("date", request.date).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail=f"No attendance records found for {request.subject} on {request.date}")
    
    html_rows = ""
    for r in result.data:
        html_rows += f"<tr><td style='border: 1px solid #ddd; padding: 8px;'>{r['enrollment']}</td><td style='border: 1px solid #ddd; padding: 8px;'>{r['name']}</td><td style='border: 1px solid #ddd; padding: 8px;'>{r['time']}</td></tr>"
    
    html_content = f"""
    <html>
    <body>
        <h2>Attendance Report: {request.subject}</h2>
        <p><strong>Date:</strong> {request.date}</p>
        <p><strong>Total Students Present:</strong> {len(result.data)}</p>
        <table style='border-collapse: collapse; width: 100%;'>
            <thead>
                <tr style='background-color: #4CAF50; color: white;'>
                    <th style='border: 1px solid #ddd; padding: 12px;'>Enrollment</th>
                    <th style='border: 1px solid #ddd; padding: 12px;'>Name</th>
                    <th style='border: 1px solid #ddd; padding: 12px;'>Time</th>
                </tr>
            </thead>
            <tbody>
                {html_rows}
            </tbody>
        </table>
        <p style='margin-top: 20px; color: #666;'>Generated by Face Recognition Attendance System</p>
    </body>
    </html>
    """
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Attendance Report - {request.subject} ({request.date})"
    msg["From"] = smtp_from
    msg["To"] = request.recipient_email
    msg.attach(MIMEText(html_content, "html"))
    
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, request.recipient_email, msg.as_string())
        
        return {"success": True, "message": f"Attendance email sent to {request.recipient_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True, log_level="debug")
