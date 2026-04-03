import express from "express";
import cors from "cors";
import axios from "axios";
import http from "http";

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

app.get("/api/subjects", async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/api/subjects`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || error.message
    });
  }
});

app.post("/api/admin/instructors", async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/api/admin/instructors`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || error.message
    });
  }
});

app.get("/api/admin/instructors", async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/api/admin/instructors`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || error.message
    });
  }
});

app.get("/api/admin/instructors/:id/details", async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/api/admin/instructors/${req.params.id}/details`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || error.message
    });
  }
});

app.get("/api/instructor/subjects", async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/api/instructor/subjects?email=${req.query.email}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || error.message
    });
  }
});

// Helper: pipe a multipart/form-data request directly to FastAPI using raw http
function pipeToFastAPI(req: express.Request, res: express.Response, path: string) {
  const headers: Record<string, string | string[]> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (key === 'host' || key === 'connection') continue;
    if (val !== undefined) headers[key] = val as string | string[];
  }

  const options: http.RequestOptions = {
    hostname: 'localhost',
    port: 8000,
    path,
    method: 'POST',
    headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let body = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', (chunk) => { body += chunk; });
    proxyRes.on('end', () => {
      try {
        res.status(proxyRes.statusCode || 200).json(JSON.parse(body));
      } catch {
        res.status(proxyRes.statusCode || 500).json({ success: false, message: body });
      }
    });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ success: false, message: err.message });
  });

  req.pipe(proxyReq);
}

app.post("/api/students/capture-frame", (req, res) => {
  pipeToFastAPI(req, res, '/api/students/capture-frame');
});

app.post("/api/attendance/recognize-frame", (req, res) => {
  pipeToFastAPI(req, res, '/api/attendance/recognize-frame');
});

app.listen(PORT, () => {
  console.log(`Express.js server running on http://localhost:${PORT}`);
  console.log(`Proxying requests to FastAPI at ${FASTAPI_URL}`);
});
