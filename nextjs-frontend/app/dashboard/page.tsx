'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Student {
  Enrollment: string;
  Name: string;
  Date: string;
  Time: string;
}

interface AttendanceFile {
  file: string;
  subject: string;
  date: string;
  records: Array<{ Enrollment: string; Name: string; Date: string; Time: string }>;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface InstructorDetails {
  instructor: { id: number; name: string; email: string };
  subjects: string[];
  attendance: any[];
}

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  confirmColor = 'bg-red-600',
  itemName
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmColor?: string;
  itemName?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h3>
          <div className="bg-neutral-50 rounded-xl p-4 mb-4">
            <p className="text-neutral-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-neutral-900 underline decoration-red-500/30 underline-offset-4">{itemName}</span>?
            </p>
          </div>
          <p className="text-sm text-neutral-500">{message}</p>
        </div>
        <div className="bg-neutral-50 p-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 ${confirmColor} text-white rounded-xl font-semibold hover:opacity-90 transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({
  isOpen,
  onSend,
  onCancel,
  subject,
  date
}: {
  isOpen: boolean;
  onSend: (email: string) => void;
  onCancel: () => void;
  subject: string;
  date: string;
}) {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) onSend(email);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2 text-center">Email Report</h3>
            <p className="text-sm text-neutral-500 text-center mb-6">
              Send attendance report for <span className="font-semibold text-neutral-900">{subject}</span> on <span className="font-semibold text-neutral-900">{date}</span>.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Recipient Email</label>
              <input
                autoFocus
                type="email"
                required
                placeholder="Enter email address"
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-neutral-50 p-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              Send Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toast({ message, onClose, type = 'info' }: { message: string; onClose: () => void; type?: 'info' | 'success' | 'error' }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-white border-l-4 border-green-500',
    error: 'bg-white border-l-4 border-red-500',
    info: 'bg-white border-l-4 border-neutral-900'
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div className={`fixed top-6 right-6 ${styles[type]} px-6 py-4 rounded-lg shadow-2xl z-50 max-w-md backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <span className="text-neutral-800 font-medium">{message}</span>
        <button onClick={onClose} className="ml-4 text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function CameraModal({
  isOpen,
  onClose,
  mode,
  enrollment,
  name,
  subject,
  title,
  confirmLabel = 'Start',
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'capture' | 'attendance';
  enrollment?: string;
  name?: string;
  subject?: string;
  title: string;
  confirmLabel?: string;
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [camError, setCamError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'preview' | 'processing'>('preview');
  const [progress, setProgress] = useState(0);
  const [recognizedCount, setRecognizedCount] = useState(0);

  // Start camera + reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCamError(null);
    setElapsed(0);
    setProgress(0);
    setRecognizedCount(0);
    setPhase('preview');
    processingRef.current = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setCamError('Camera access denied or not available.');
        console.error(err);
      });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  };

  const handleStart = async () => {
    setPhase('processing');
    setElapsed(0);
    setProgress(0);
    setRecognizedCount(0);
    processingRef.current = true;

    // Start timer and set 30s timeout
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    intervalRef.current = timer;

    const timeoutId = setTimeout(() => {
      if (processingRef.current) {
        processingRef.current = false;
        onClose();
      }
    }, 30000); // 30 seconds timeout

    try {
      if (mode === 'capture' && enrollment && name) {
        // Enrolment Loop: capture 30 images
        let count = 0;
        const total = 30;
        while (count < total && processingRef.current) {
          const blob = await captureFrame();
          if (blob) {
            try {
              const res = await api.captureFrame(enrollment, name, count + 1, blob);
              if (res && res.success) {
                count++;
                setProgress(count);
              }
              // If success is false (e.g. invalid image), just retry without counting
            } catch (e) {
              console.error('Frame capture failed', e);
              // Wait a bit before retry
              await new Promise(r => setTimeout(r, 500));
            }
          }
          await new Promise(r => setTimeout(r, 200)); // Small delay between captures
        }
      } else if (mode === 'attendance' && subject) {
        // Attendance Loop: recognize for 20 seconds or until some condition
        const startTime = Date.now();
        const duration = 20000; // 20 seconds
        let recognizedAny = false;
        const recognizedSession = new Set<string>();

        while (Date.now() - startTime < duration && processingRef.current) {
          const blob = await captureFrame();
          if (blob) {
            try {
              const res = await api.recognizeFrame(subject, blob);
              if (res.recognized && res.recognized.length > 0) {
                res.recognized.forEach((r: any) => {
                  if (!recognizedSession.has(r.enrollment)) {
                    recognizedSession.add(r.enrollment);
                    setRecognizedCount(prev => prev + 1);
                  }
                });
                recognizedAny = true;
              }
            } catch (e) {
              console.error('Frame recognition failed', e);
            }
          }
          await new Promise(r => setTimeout(r, 800)); // Recognition is heavier, slower frequency
        }
      }

      if (processingRef.current) {
        clearTimeout(timeoutId);
        onComplete();
        onClose();
      }
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      clearInterval(timer);
      processingRef.current = false;
    }
  };

  const captureFrame = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) return resolve(null);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Dimmed backdrop — only closeable in preview phase */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={phase === 'preview' ? handleClose : undefined}
      />

      {/* Modal card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          </div>
          {phase === 'preview' && (
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live camera feed — always visible in both phases */}
        <div className="bg-neutral-950 flex items-center justify-center relative" style={{ minHeight: '260px' }}>
          {camError ? (
            <div className="text-center p-8">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-red-400 font-medium">{camError}</p>
              <p className="text-neutral-500 text-sm mt-1">Please allow camera access and try again.</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full object-cover"
              style={{ maxHeight: '280px' }}
            />
          )}

          {/* Processing overlay on top of video */}
          {phase === 'processing' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 animate-spin text-green-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — changes based on phase */}
        {phase === 'preview' ? (
          <div className="px-6 py-5">
            <p className="text-center text-sm text-neutral-500 mb-4">
              Position yourself in front of the camera, then click <strong>{confirmLabel}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {confirmLabel}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 flex flex-col items-center gap-3">
            {/* Status */}
            <div className="text-center">
              <p className="text-base font-semibold text-neutral-900">
                {mode === 'capture' ? 'Capturing images…' : 'Recognizing faces…'}
              </p>
              {mode === 'attendance' && recognizedCount > 0 && (
                <p className="text-xs text-green-600 font-medium">Found: {recognizedCount} match(es)</p>
              )}
            </div>

            {/* Green processing timer */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-6 py-2.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 font-mono text-2xl font-bold tracking-widest">
                {formatTime(elapsed)}
              </span>
              <span className="text-green-600 text-sm font-medium">Processing time</span>
            </div>

            <p className="text-xs text-neutral-400 text-center">
              Do not close this window. This will complete automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function Dashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceFile[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [instructorSubjects, setInstructorSubjects] = useState<string[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number | string; name: string; type: 'instructor' | 'student' } | null>(null);
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; subject: string; date: string } | null>(null);
  const [cameraModal, setCameraModal] = useState<{ isOpen: boolean; mode: 'capture' | 'attendance' } | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  // Forms

  const [newStudent, setNewStudent] = useState({ enrollment: '', name: '' });
  const [subject, setSubject] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [newInstructor, setNewInstructor] = useState({ name: '', email: '', password: '', subjects: [] as string[] });

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/');
      return;
    }
    const role = localStorage.getItem('userRole') || '';
    const name = localStorage.getItem('userName') || '';
    const email = localStorage.getItem('userEmail') || '';
    setUserRole(role);
    setUserName(name);
    setUserEmail(email);

    if (role === 'admin') {
      setActiveTab('instructors');
    } else if (role === 'instructor') {
      setActiveTab('take-attendance');
      fetchInstructorSubjects(email);
    }
  }, [router]);

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const fetchAttendance = async (subj?: string) => {
    try {
      const data = await api.getAttendance(subj);
      setAttendance(data.attendance_files || []);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const data = await api.getInstructors();
      setInstructors(data.instructors || []);
    } catch (err) {
      console.error('Failed to fetch instructors', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await api.getSubjects();
      setAvailableSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const fetchInstructorSubjects = async (email: string) => {
    try {
      const data = await api.getInstructorSubjects(email);
      setInstructorSubjects(data.subjects || []);
      if (data.subjects && data.subjects.length > 0) {
        setSubject(data.subjects[0]);
      }
    } catch (err) {
      console.error('Failed to fetch instructor subjects', err);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchInstructors();
      fetchSubjects();
      fetchStudents();
      fetchAttendance();
    } else if (userRole === 'instructor') {
      fetchStudents();
      fetchAttendance();
    }
  }, [userRole]);

  const handleCaptureImages = async () => {
    if (!newStudent.enrollment || !newStudent.name) {
      showToast('Please enter enrollment and name', 'error');
      return;
    }
    // Open camera modal first, then call API after modal closes
    setCameraModal({ isOpen: true, mode: 'capture' });
  };

  const handleMarkAttendance = async () => {
    if (!subject) {
      showToast('Please select a subject', 'error');
      return;
    }
    setCameraModal({ isOpen: true, mode: 'attendance' });
  };

  const handleCameraComplete = () => {
    if (cameraModal?.mode === 'attendance') {
      showToast('Attendance process finished', 'success');
      fetchAttendance();
    } else {
      showToast('Capture process finished. You can now train the model.', 'success');
      setNewStudent({ enrollment: '', name: '' });
      fetchStudents();
    }
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();

    // Automatically add current subject input if not empty
    let finalSubjects = [...newInstructor.subjects];
    if (subjectInput.trim() && !finalSubjects.includes(subjectInput.trim())) {
      if (finalSubjects.length < 5) {
        finalSubjects.push(subjectInput.trim());
        setSubjectInput('');
      }
    }

    if (!newInstructor.name || !newInstructor.email || !newInstructor.password || finalSubjects.length === 0) {
      showToast('Please fill all fields and select at least one subject', 'error');
      return;
    }
    if (finalSubjects.length > 5) {
      showToast('Max 5 subjects per instructor', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await api.addInstructor({ ...newInstructor, subjects: finalSubjects });
      showToast(result.message, 'success');
      setNewInstructor({ name: '', email: '', password: '', subjects: [] });
      fetchInstructors();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add instructor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstructor = (id: number, name: string) => {
    setDeleteConfirm({ id, name, type: 'instructor' });
  };

  const handleDeleteStudent = (enrollment: string, name: string) => {
    setDeleteConfirm({ id: enrollment, name, type: 'student' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    const { id, name, type } = deleteConfirm;
    setDeleteConfirm(null);
    setLoading(true);
    try {
      if (type === 'instructor') {
        const result = await api.deleteInstructor(id as number);
        showToast(result.message, 'success');
        fetchInstructors();
      } else {
        const result = await api.deleteStudent(id as string);
        showToast(result.message, 'success');
        fetchStudents();
        // Optionally refresh attendance as well since student deletion cascades
        fetchAttendance();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || `Failed to delete ${type}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (email: string) => {
    if (!emailModal) return;
    const { subject, date } = emailModal;
    setEmailModal(null);
    setLoading(true);
    try {
      const result = await api.sendAttendanceEmail(subject, date, email);
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewInstructorDetails = async (id: number) => {
    setLoading(true);
    try {
      const result = await api.getInstructorDetails(id);
      setSelectedInstructor(result);
      setActiveTab('instructor-details');
    } catch (err) {
      showToast('Failed to fetch instructor details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const adminTabs = [
    { id: 'instructors', label: 'Instructors' },
    { id: 'user-management', label: 'Add Instructor' },
    { id: 'students', label: 'Student Management' },
    { id: 'attendance', label: 'All Attendance' },
    { id: 'train', label: 'Train Model' }
  ];

  const instructorTabs = [
    { id: 'take-attendance', label: 'Take Attendance' },
    { id: 'attendance-history', label: 'Attendance History' },
    { id: 'students-list', label: 'Registered Students' }
  ];

  const currentTabs = userRole === 'admin' ? adminTabs : instructorTabs;

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 z-50 overflow-hidden bg-neutral-200">
          <div className="h-full w-full bg-neutral-900 animate-loading-bar origin-left"></div>
        </div>
      )}

      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-bold">AMS</div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Attendance System</h1>
              <p className="text-xs text-neutral-500">Welcome, {userName} ({userRole})</p>
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all font-medium">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-neutral-200 w-fit overflow-x-auto">
          {currentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ADMIN: Instructors List */}
        {activeTab === 'instructors' && userRole === 'admin' && (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Instructor Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map(instr => (
                <div
                  key={instr.id}
                  className="p-6 border border-neutral-100 rounded-2xl hover:border-neutral-900 transition-all bg-neutral-50 group relative"
                >
                  <div onClick={() => viewInstructorDetails(instr.id)} className="cursor-pointer">
                    <h3 className="text-lg font-semibold group-hover:text-neutral-900">{instr.name}</h3>
                    <p className="text-sm text-neutral-500">{instr.email}</p>
                    <div className="mt-4 text-xs font-medium text-neutral-900 flex items-center gap-1">
                      View Details
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInstructor(instr.id, instr.name);
                    }}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Instructor"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {instructors.length === 0 && <p className="text-neutral-500">No instructors added yet.</p>}
            </div>

          </div>
        )}

        {/* ADMIN: Add Instructor */}
        {activeTab === 'user-management' && userRole === 'admin' && (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm max-w-2xl">
            <h2 className="text-xl font-bold mb-6">Add New Instructor</h2>
            <form onSubmit={handleAddInstructor} className="space-y-4">
              <input
                type="text" placeholder="Full Name"
                className="w-full px-4 py-3 border rounded-xl"
                value={newInstructor.name} onChange={e => setNewInstructor({ ...newInstructor, name: e.target.value })}
              />
              <input
                type="email" placeholder="Email"
                className="w-full px-4 py-3 border rounded-xl"
                value={newInstructor.email} onChange={e => setNewInstructor({ ...newInstructor, email: e.target.value })}
              />
              <input
                type="password" placeholder="Password"
                className="w-full px-4 py-3 border rounded-xl"
                value={newInstructor.password} onChange={e => setNewInstructor({ ...newInstructor, password: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-2">Allocate Subjects (Select 1-5)</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Type subject name..."
                    className="flex-1 px-4 py-2 border rounded-xl"
                    value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (subjectInput.trim() && !newInstructor.subjects.includes(subjectInput.trim())) {
                          if (newInstructor.subjects.length < 5) {
                            setNewInstructor({ ...newInstructor, subjects: [...newInstructor.subjects, subjectInput.trim()] });
                            setSubjectInput('');
                          } else {
                            showToast('Max 5 subjects allowed', 'error');
                          }
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (subjectInput.trim() && !newInstructor.subjects.includes(subjectInput.trim())) {
                        if (newInstructor.subjects.length < 5) {
                          setNewInstructor({ ...newInstructor, subjects: [...newInstructor.subjects, subjectInput.trim()] });
                          setSubjectInput('');
                        } else {
                          showToast('Max 5 subjects allowed', 'error');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {newInstructor.subjects.map(sub => (
                    <div key={sub} className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200 group">
                      <span className="text-sm font-medium">{sub}</span>
                      <button
                        type="button"
                        onClick={() => setNewInstructor({ ...newInstructor, subjects: newInstructor.subjects.filter(s => s !== sub) })}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {newInstructor.subjects.length === 0 && (
                    <p className="text-sm text-neutral-400 italic">No subjects added yet. Type and press Add (or just submit to auto-add).</p>
                  )}
                </div>

                {availableSubjects.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Suggested from existing:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSubjects
                        .filter(s => !newInstructor.subjects.includes(s.name))
                        .slice(0, 6)
                        .map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              if (newInstructor.subjects.length < 5) {
                                setNewInstructor({ ...newInstructor, subjects: [...newInstructor.subjects, s.name] });
                              } else {
                                showToast('Max 5 subjects allowed', 'error');
                              }
                            }}
                            className="px-2 py-1 bg-white border border-neutral-200 rounded-md text-xs hover:border-neutral-900 transition-all"
                          >
                            + {s.name}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-neutral-900 text-white py-3 rounded-xl font-bold">Add Instructor</button>
            </form>
          </div>
        )}

        {/* ADMIN: Instructor Details */}
        {activeTab === 'instructor-details' && selectedInstructor && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <button onClick={() => setActiveTab('instructors')} className="text-sm text-neutral-500 mb-4 flex items-center gap-1 hover:text-neutral-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to List
              </button>
              <h2 className="text-2xl font-bold">{selectedInstructor.instructor.name}</h2>
              <p className="text-neutral-500">{selectedInstructor.instructor.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedInstructor.subjects.map(s => (
                  <span key={s} className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Attendance History</h3>
                <button
                  onClick={() => downloadCSV(selectedInstructor.attendance, `attendance_${selectedInstructor.instructor.name}.csv`)}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm"
                >
                  Download CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInstructor.attendance.map((a, i) => (
                      <tr key={i} className="border-b hover:bg-neutral-50">
                        <td className="py-3 px-4">{a.name} ({a.enrollment})</td>
                        <td className="py-3 px-4">{a.subject}</td>
                        <td className="py-3 px-4">{a.date}</td>
                        <td className="py-3 px-4">{a.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INSTRUCTOR: Take Attendance */}
        {activeTab === 'take-attendance' && userRole === 'instructor' && (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm max-w-2xl">
            <h2 className="text-xl font-bold mb-6">Take Attendance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Subject</label>
                <select
                  className="w-full px-4 py-3 border rounded-xl"
                  value={subject} onChange={e => setSubject(e.target.value)}
                >
                  {instructorSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={handleMarkAttendance}
                className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Open Camera & Mark Attendance
              </button>
            </div>
          </div>
        )}

        {/* INSTRUCTOR: History */}
        {activeTab === 'attendance-history' && userRole === 'instructor' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h2 className="text-xl font-bold">My Subjects Attendance</h2>
                <div className="flex items-center gap-3 bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                  <span className="text-sm font-medium text-neutral-500 ml-2">Filter by Date:</span>
                  <input
                    type="date"
                    className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-neutral-900 transition-all outline-none"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="p-1.5 hover:bg-neutral-200 rounded-md transition-colors text-neutral-400"
                      title="Clear Filter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const filteredAttendance = attendance
                  .filter(f => instructorSubjects.includes(f.subject))
                  .filter(f => !selectedDate || f.date === selectedDate);
                
                if (filteredAttendance.length === 0) {
                  return (
                    <div className="text-center py-12 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                      <svg className="w-12 h-12 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-neutral-500 font-medium">
                        {selectedDate 
                          ? `No attendance records found for ${new Date(selectedDate).toLocaleDateString()}.`
                          : "No attendance records found for your subjects."}
                      </p>
                    </div>
                  );
                }

                return filteredAttendance.map((file, i) => (
                  <div key={i} className="mb-6 border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-neutral-50 flex justify-between items-center border-b">
                      <div>
                        <h3 className="font-bold">{file.subject}</h3>
                        <p className="text-sm text-neutral-500">{file.date}</p>
                      </div>
                      <button
                        onClick={() => setEmailModal({ isOpen: true, subject: file.subject, date: file.date })}
                        className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium"
                      >
                        Email Report
                      </button>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white border-b">
                          <th className="p-3">Enrollment</th>
                          <th className="p-3">Name</th>
                          <th className="p-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {file.records.map((r, j) => (
                          <tr key={j} className="border-b">
                            <td className="p-3">{r.Enrollment}</td>
                            <td className="p-3">{r.Name}</td>
                            <td className="p-3">{r.Time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Common: Students List */}
        {(activeTab === 'students' || activeTab === 'students-list') && (
          <div className="space-y-6">
            {activeTab === 'students' && userRole === 'admin' && (
              <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Capture New Student</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text" placeholder="Enrollment No"
                    className="flex-1 px-4 py-3 border rounded-xl"
                    value={newStudent.enrollment} onChange={e => setNewStudent({ ...newStudent, enrollment: e.target.value })}
                  />
                  <input
                    type="text" placeholder="Student Name"
                    className="flex-1 px-4 py-3 border rounded-xl"
                    value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                  <button
                    onClick={handleCaptureImages}
                    disabled={loading}
                    className="px-8 py-3 bg-neutral-900 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    Capture Images
                  </button>
                </div>
                <p className="mt-4 text-sm text-neutral-500 italic">This will open the camera to capture 45 images for face recognition training.</p>
              </div>
            )}

            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Registered Students</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4">Enrollment</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Registered Date</th>
                      {userRole === 'admin' && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} className="border-b hover:bg-neutral-50 group">
                        <td className="py-3 px-4 font-mono">{s.Enrollment}</td>
                        <td className="py-3 px-4 font-medium">{s.Name}</td>
                        <td className="py-3 px-4 text-neutral-500">{s.Date}</td>
                        {userRole === 'admin' && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteStudent(s.Enrollment, s.Name)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Student"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Train Model */}
        {activeTab === 'train' && userRole === 'admin' && (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Train Face Recognition Model</h2>
            <p className="text-neutral-500 mb-6">Train the model to recognize new students added to the system.</p>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const r = await api.trainModel();
                  showToast(r.message, 'success');
                } catch (e) {
                  showToast('Training failed', 'error');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-8 py-4 bg-neutral-900 text-white rounded-xl font-bold"
            >
              Start Training Process
            </button>
          </div>
        )}

        {/* All Attendance (Admin) */}
        {activeTab === 'attendance' && userRole === 'admin' && (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6">All Attendance Records</h2>
            {attendance.map((file, i) => (
              <div key={i} className="mb-6 border rounded-2xl overflow-hidden">
                <div className="p-4 bg-neutral-50 flex justify-between items-center border-b">
                  <h3 className="font-bold">{file.subject} - {file.date}</h3>
                  <button onClick={() => downloadCSV(file.records, `${file.subject}_${file.date}.csv`)} className="text-sm font-medium">Download CSV</button>
                </div>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {file.records.map((r, j) => (
                      <tr key={j} className="border-b"><td className="p-3">{r.Name} ({r.Enrollment})</td><td className="p-3">{r.Time}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.type === 'instructor' ? 'Delete Instructor' : 'Delete Student'}
        itemName={deleteConfirm?.name}
        message={deleteConfirm?.type === 'instructor'
          ? 'This action cannot be undone and will remove all their subject associations.'
          : 'This action cannot be undone and will remove their attendance records and training data.'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <EmailModal
        isOpen={!!emailModal}
        subject={emailModal?.subject || ''}
        date={emailModal?.date || ''}
        onSend={handleSendEmail}
        onCancel={() => setEmailModal(null)}
      />

      <CameraModal
        isOpen={!!cameraModal?.isOpen}
        mode={cameraModal?.mode}
        enrollment={newStudent.enrollment}
        name={newStudent.name}
        subject={subject}
        title={cameraModal?.mode === 'attendance' ? 'Mark Attendance' : 'Capture Student Images'}
        confirmLabel={cameraModal?.mode === 'attendance' ? 'Mark Attendance' : 'Capture Images'}
        onClose={() => setCameraModal(null)}
        onComplete={handleCameraComplete}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}


      <style jsx global>{`
        @keyframes loading-bar {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
