'use client';

import { useState, useEffect } from 'react';
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
  records: Array<{ Enrollment: number; Name: string; Date: string; Time: string }>;
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

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-neutral-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
        <p className="text-neutral-500 mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ isOpen, onClose, subject, date, onSend }: {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  date: string;
  onSend: (email: string) => void;
}) {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-neutral-200">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Send Attendance Report</h3>
        <div className="bg-neutral-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-500">Subject</span>
            <span className="text-neutral-900 font-medium">{subject}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Date</span>
            <span className="text-neutral-900 font-medium">{date}</span>
          </div>
        </div>
        <input
          type="email"
          placeholder="Enter recipient email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 mb-6 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
        />
        <div className="flex gap-3">
          <button
            onClick={() => { onClose(); setEmail(''); }}
            className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSend(email); setEmail(''); }}
            disabled={!email}
            className="flex-1 bg-neutral-900 text-white px-4 py-3 rounded-xl hover:bg-neutral-800 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [newStudent, setNewStudent] = useState({ enrollment: '', name: '' });
  const [subject, setSubject] = useState('');
  const [emailModal, setEmailModal] = useState({ isOpen: false, subject: '', date: '' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; enrollment: string }>({ isOpen: false, enrollment: '' });

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/');
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

  const fetchAttendance = async () => {
    try {
      const data = await api.getAttendance();
      setAttendance(data.attendance_files || []);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAttendance();
  }, []);

  const handleCaptureImages = async () => {
    if (!newStudent.enrollment || !newStudent.name) {
      showToast('Please enter enrollment and name', 'error');
      return;
    }
    setLoading(true);
    showToast('Capturing images... Please look at the camera', 'info');
    try {
      const result = await api.captureStudent(newStudent.enrollment, newStudent.name);
      showToast(result.message, 'success');
      setNewStudent({ enrollment: '', name: '' });
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to capture images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    setLoading(true);
    showToast('Training model...', 'info');
    try {
      const result = await api.trainModel();
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to train model', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!subject) {
      showToast('Please enter subject name', 'error');
      return;
    }
    setLoading(true);
    showToast('Marking attendance... Please look at the camera', 'info');
    try {
      const result = await api.markAttendance(subject);
      showToast(result.message, 'success');
      setSubject('');
      fetchAttendance();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to mark attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  const handleDeleteStudent = async (enrollment: string) => {
    setConfirmModal({ isOpen: true, enrollment });
  };

  const confirmDeleteStudent = async () => {
    const enrollment = confirmModal.enrollment;
    setConfirmModal({ isOpen: false, enrollment: '' });
    setLoading(true);
    try {
      const result = await api.deleteStudent(enrollment);
      showToast(result.message, 'success');
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete student', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (recipientEmail: string) => {
    setLoading(true);
    setEmailModal({ isOpen: false, subject: '', date: '' });
    try {
      const result = await api.sendAttendanceEmail(emailModal.subject, emailModal.date, recipientEmail);
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'students', label: 'Students', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'attendance', label: 'Attendance', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )},
    { id: 'train', label: 'Train Model', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )}
  ];

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 z-50 overflow-hidden bg-neutral-200">
          <div className="h-full w-full bg-neutral-900 animate-loading-bar origin-left"></div>
        </div>
      )}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Face Recognition AMS</h1>
                <p className="text-xs text-neutral-500">Attendance Management System</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-neutral-200 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white shadow-lg'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Add New Student</h2>
                  <p className="text-sm text-neutral-500">Capture face images for recognition</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Enrollment Number"
                  value={newStudent.enrollment}
                  onChange={(e) => setNewStudent({ ...newStudent, enrollment: e.target.value })}
                  className="px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                />
                <input
                  type="text"
                  placeholder="Student Name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                />
                <button
                  onClick={handleCaptureImages}
                  disabled={loading}
                  className="bg-neutral-900 text-white px-6 py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                >
                    {loading ? (
                      <>
                        Capturing...
                      </>
                    ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Capture Images
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Registered Students</h2>
                    <p className="text-sm text-neutral-500">{students.length} students enrolled</p>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Enrollment</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {students.map((s, i) => (
                      <tr key={i} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900">{s.Enrollment}</td>
                        <td className="px-6 py-4 text-sm text-neutral-700">{s.Name}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">{s.Date}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">{s.Time}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteStudent(s.Enrollment)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all text-sm font-medium disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <p className="text-neutral-500 font-medium">No students registered yet</p>
                            <p className="text-neutral-400 text-sm mt-1">Add your first student above</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Mark Attendance</h2>
                  <p className="text-sm text-neutral-500">Use face recognition to mark attendance</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                />
                <button
                  onClick={handleMarkAttendance}
                  disabled={loading}
                  className="bg-neutral-900 text-white px-6 py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                >
                    {loading ? (
                      <>
                        Scanning...
                      </>
                    ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Start Face Recognition
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Attendance Records</h2>
                  <p className="text-sm text-neutral-500">{attendance.length} records found</p>
                </div>
              </div>
              
              {attendance.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-neutral-500 font-medium">No attendance records yet</p>
                    <p className="text-neutral-400 text-sm mt-1">Start marking attendance above</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendance.map((file, i) => (
                    <div key={i} className="border border-neutral-200 rounded-xl overflow-hidden">
                      <div className="flex justify-between items-center px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{file.subject}</h3>
                          <p className="text-neutral-500 text-sm">{file.date}</p>
                        </div>
                        <button
                          onClick={() => setEmailModal({ isOpen: true, subject: file.subject, date: file.date })}
                          disabled={loading}
                          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-xl hover:bg-neutral-800 disabled:opacity-40 transition-all text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send Report
                        </button>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white border-b border-neutral-100">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Enrollment</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {file.records.map((r, j) => (
                            <tr key={j} className="hover:bg-neutral-50 transition-colors">
                              <td className="px-6 py-3 text-sm font-medium text-neutral-900">{r.Enrollment}</td>
                              <td className="px-6 py-3 text-sm text-neutral-700">{r.Name}</td>
                              <td className="px-6 py-3 text-sm text-neutral-500">{r.Time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'train' && (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Train Recognition Model</h2>
                  <p className="text-sm text-neutral-500">Update the face recognition model</p>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-xl p-6 mb-6 border border-neutral-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neutral-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-neutral-700 font-medium">When to train?</p>
                    <p className="text-neutral-500 text-sm mt-1">
                      Train the model after adding new students. This will process all captured images and update the face recognition model for accurate attendance marking.
                    </p>
                  </div>
                </div>
              </div>
              
                <button
                  onClick={handleTrainModel}
                  disabled={loading}
                  className="w-full bg-neutral-900 text-white px-8 py-4 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      Training Model...
                    </>
                  ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Train Model
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <EmailModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal({ isOpen: false, subject: '', date: '' })}
        subject={emailModal.subject}
        date={emailModal.date}
        onSend={handleSendEmail}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, enrollment: '' })}
        onConfirm={confirmDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete student ${confirmModal.enrollment}? This action cannot be undone.`}
      />
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
