const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const todoRoutes = require('./routes/todos');

dotenv.config();

const app = express();

// Middleware
app.use(cors());           // allow cross-origin requests from frontend
app.use(express.json());   // parse incoming JSON request bodies

// Health check — Kubernetes liveness/readiness probes call this
// If this returns 200, K8s knows the pod is healthy
// If this fails, K8s will restart the pod
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All todo routes live under /api/todos
app.use('/api/todos', todoRoutes);

const PORT = process.env.PORT || 5000;

// NODE_ENV=test is set automatically by Jest
// We skip DB connection during tests so tests don't need a real MongoDB
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Export app so supertest can import it in tests
module.exports = app;