import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = 3001;
const FASTAPI_URL = "http://localhost:8000";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Express.js Gateway API", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.post("/api/students/capture", async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/api/students/capture`, req.body, {
      timeout: 300000
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.post("/api/model/train", async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/api/model/train`, {}, {
      timeout: 300000
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.post("/api/attendance/mark", async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/api/attendance/mark`, req.body, {
      timeout: 300000
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/api/students`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.delete("/api/students/:enrollment", async (req, res) => {
  try {
    const response = await axios.delete(`${FASTAPI_URL}/api/students/${req.params.enrollment}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.get("/api/attendance", async (req, res) => {
  try {
    const { subject } = req.query;
    const url = subject 
      ? `${FASTAPI_URL}/api/attendance?subject=${subject}` 
      : `${FASTAPI_URL}/api/attendance`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/api/auth/login`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.post("/api/email/send-attendance", async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/api/email/send-attendance`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.detail || error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Express.js server running on http://localhost:${PORT}`);
  console.log(`Proxying requests to FastAPI at ${FASTAPI_URL}`);
});
