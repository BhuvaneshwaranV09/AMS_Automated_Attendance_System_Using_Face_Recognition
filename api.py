from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import psycopg2

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
        
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students');")
        students_exists = cur.fetchone()[0]
        
        if not students_exists:
            print("Creating database schema...")
            
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
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS subjects (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            
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
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    role VARCHAR(20) DEFAULT 'user',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            
            cur.execute("""
                INSERT INTO users (username, password_hash, role) 
                VALUES ('admin', 'admin123', 'admin')
                ON CONFLICT (username) DO NOTHING;
            """)
            
            conn.commit()
            print("Database schema created successfully!")
        else:
            print("Database schema already exists")
        
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
    
    if supabase and result.get("recognized"):
        for record in result.get("recognized", []):
            try:
                print(f"[DEBUG] Saving attendance for: {record}")
                student = supabase.table("students").select("id").eq("enrollment", str(record.get("enrollment", ""))).execute()
                student_id = student.data[0]["id"] if student.data else None
                print(f"[DEBUG] Student ID found: {student_id}")
                
                insert_data = {
                    "enrollment": str(record.get("enrollment", "")),
                    "name": record.get("name", ""),
                    "subject": request.subject,
                    "date": record.get("date", ""),
                    "time": record.get("time", "")
                }
                print(f"[DEBUG] Insert data: {insert_data}")
                
                insert_result = supabase.table("attendance").insert(insert_data).execute()
                print(f"[DEBUG] Insert result: {insert_result.data}")
            except Exception as e:
                print(f"[ERROR] Supabase attendance error for {record}: {e}")
                import traceback
                traceback.print_exc()
    
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
    import shutil
    
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


@app.post("/api/auth/login")
async def login(request: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    result = supabase.table("users").select("*").eq("username", request.username).execute()
    if result.data:
        user = result.data[0]
        if user["password_hash"] == request.password:
            return {"success": True, "message": "Login successful", "role": user["role"], "email": user.get("email")}
    
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
