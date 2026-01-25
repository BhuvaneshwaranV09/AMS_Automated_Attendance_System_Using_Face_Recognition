import axios from 'axios';

const API_BASE = '/api';

export const api = {
  login: async (username: string, password: string) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    return res.data;
  },

  getStudents: async () => {
    const res = await axios.get(`${API_BASE}/students`);
    return res.data;
  },

  captureStudent: async (enrollment: string, name: string, numImages?: number) => {
    const res = await axios.post(`${API_BASE}/students/capture`, {
      enrollment,
      name,
      num_images: numImages || 30,
    }, {
      timeout: 50000, // 60 seconds timeout for image capture
    });
    return res.data;
  },

  trainModel: async () => {
    const res = await axios.post(`${API_BASE}/model/train`);
    return res.data;
  },

  markAttendance: async (subject: string, duration?: number) => {
    const res = await axios.post(`${API_BASE}/attendance/mark`, {
      subject,
      duration: duration || 20,
    });
    return res.data;
  },

  getAttendance: async (subject?: string) => {
    const url = subject ? `${API_BASE}/attendance?subject=${subject}` : `${API_BASE}/attendance`;
    const res = await axios.get(url);
    return res.data;
  },

  deleteStudent: async (enrollment: string) => {
    const res = await axios.delete(`${API_BASE}/students/${enrollment}`);
    return res.data;
  },

    sendAttendanceEmail: async (subject: string, date: string, recipientEmail: string) => {
      const res = await axios.post(`${API_BASE}/email/send-attendance`, {
        subject,
        date,
        recipient_email: recipientEmail,
      });
      return res.data;
    },

    getSubjects: async () => {
      const res = await axios.get(`${API_BASE}/subjects`);
      return res.data;
    },

    addInstructor: async (instructorData: any) => {
      const res = await axios.post(`${API_BASE}/admin/instructors`, instructorData);
      return res.data;
    },

    getInstructors: async () => {
      const res = await axios.get(`${API_BASE}/admin/instructors`);
      return res.data;
    },

    getInstructorDetails: async (id: number) => {
      const res = await axios.get(`${API_BASE}/admin/instructors/${id}/details`);
      return res.data;
    },

    getInstructorSubjects: async (email: string) => {
      const res = await axios.get(`${API_BASE}/instructor/subjects?email=${email}`);
      return res.data;
    },

    deleteInstructor: async (id: number) => {
      const res = await axios.delete(`${API_BASE}/admin/instructors/${id}`);
      return res.data;
    },
  };
