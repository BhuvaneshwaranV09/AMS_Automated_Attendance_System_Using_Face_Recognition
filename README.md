# AMS_Run - Face Recognition Based Attendance Management System

A comprehensive attendance management system that uses facial recognition technology to automate student attendance tracking. Built with FastAPI backend, Next.js frontend, and Supabase integration.

## 🚀 Features

- **Face Recognition**: Automated attendance marking using computer vision
- **Student Management**: Register students with facial data capture
- **Real-time Attendance**: Live face detection and recognition during classes
- **Web Dashboard**: Modern React-based interface for management
- **Database Integration**: Supabase for data storage and management
- **Email Notifications**: Send attendance reports via email
- **Multi-subject Support**: Track attendance for different subjects
- **RESTful API**: Complete API for integration with other systems
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🛠 Tech Stack

### Backend
- **Python 3.8+**
- **FastAPI** - Modern, fast web framework
- **OpenCV** - Computer vision library
- **Supabase** - Backend-as-a-Service (Database & Storage)
- **PostgreSQL** - Primary database
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client

### Additional Services
- **Express.js** - Additional server (TypeScript)
- **Bun** - Fast JavaScript runtime

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Python 3.8 or higher**
- **Node.js 18+ and npm/yarn/bun**
- **Git**
- **Camera/Webcam** (for face capture and recognition)
- **Supabase Account** (for database and storage)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AMS_Run
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_postgresql_connection_string

# SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
```

### 3. Frontend Setup

#### Install Dependencies

```bash
cd nextjs-frontend
bun install  # or npm install / yarn install
```

#### Configure API Endpoint

Update the API base URL in `nextjs-frontend/lib/api.ts` if needed:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

### 4. Express Server Setup (Optional)

```bash
cd express-server
bun install
```

## 🚀 Running the Application

### Start the Backend API

```bash
# From the root directory
python api.py
```

The API will be available at `http://localhost:8000`

### Start the Frontend

```bash
cd nextjs-frontend
bun run dev
```

The frontend will be available at `http://localhost:3000`

### Start Express Server (if needed)

```bash
cd express-server
bun run dev
```

## 📖 Usage

### 1. Initial Setup

1. **Database Initialization**: The application automatically creates required tables on first run
2. **Storage Setup**: Creates a Supabase storage bucket for training images

### 2. Student Registration

1. Access the web dashboard at `http://localhost:3000`
2. Navigate to student registration
3. Enter student details (enrollment number, name, email, phone)
4. Capture facial images (45 images recommended for better accuracy)
5. Images are automatically uploaded to Supabase storage

### 3. Model Training

1. After registering students, train the recognition model
2. Go to the training section in the dashboard
3. Click "Train Model" to process all captured images
4. The system creates a face recognition model using LBPH algorithm

### 4. Attendance Marking

1. Start an attendance session for a specific subject
2. The system opens the camera and detects faces in real-time
3. Recognized students are automatically marked as present
4. Attendance data is stored in the database with timestamps

### 5. Viewing Reports

- Access attendance records through the dashboard
- Filter by subject and date
- Export attendance reports as CSV
- Send reports via email

## 🔌 API Endpoints

### Core Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/students/capture` - Capture student images
- `POST /api/model/train` - Train recognition model
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/students` - Get all students
- `DELETE /api/students/{enrollment}` - Delete student
- `GET /api/attendance` - Get attendance records
- `POST /api/auth/login` - User authentication
- `POST /api/email/send-attendance` - Send attendance email

### Request/Response Examples

#### Capture Student Images
```bash
curl -X POST "http://localhost:8000/api/students/capture" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollment": "CS001",
    "name": "John Doe",
    "num_images": 45,
    "email": "john@example.com"
  }'
```

#### Mark Attendance
```bash
curl -X POST "http://localhost:8000/api/attendance/mark" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Computer Science",
    "duration": 30
  }'
```

## 🗂 Project Structure

```
AMS_Run/
├── api.py                          # FastAPI application
├── requirements.txt                # Python dependencies
├── services/
│   └── face_recognition_service.py # Face recognition logic
├── TrainingImage/                  # Local training images
├── TrainingImageLabel/             # Model and mappings
├── nextjs-frontend/                # React frontend
│   ├── app/                        # Next.js app directory
│   ├── lib/                        # Utilities
│   └── package.json
├── express-server/                 # Express.js server
├── .env                            # Environment variables
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

## 🔧 Configuration

### Face Recognition Settings

- **Face Detection**: Uses Haar cascades for face detection
- **Recognition Algorithm**: Local Binary Patterns Histograms (LBPH)
- **Confidence Threshold**: 70 (lower values = stricter matching)
- **Training Images**: 45 images per student recommended

### Camera Settings

- **Resolution**: Default camera resolution
- **Frame Rate**: Real-time processing
- **Detection Scale**: 1.2 (face detection sensitivity)

## 🐛 Troubleshooting

### Common Issues

1. **Camera Not Accessible**
   - Ensure camera permissions are granted
   - Check if camera is being used by another application
   - Try restarting the application

2. **Model Training Fails**
   - Ensure sufficient training images (minimum 10 per student)
   - Check image quality and lighting conditions
   - Verify all images contain clear face detections

3. **Database Connection Issues**
   - Verify Supabase credentials in `.env`
   - Check internet connection
   - Ensure Supabase project is active

4. **Low Recognition Accuracy**
   - Capture more training images (45+ recommended)
   - Ensure good lighting during capture
   - Train model after adding new students

### Debug Mode

Run the API with debug logging:

```bash
uvicorn api:app --reload --log-level debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Write clear commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Future Enhancements

- [ ] Mobile app support
- [ ] Advanced analytics dashboard
- [ ] Integration with learning management systems
- [ ] Multi-camera support
- [ ] Real-time notifications
- [ ] Advanced face recognition algorithms
- [ ] Cloud deployment guides

---

**Note**: This system requires a working camera for face capture and recognition. Ensure proper lighting and clear face visibility for optimal performance.
