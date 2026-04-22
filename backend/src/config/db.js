const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` DB Connection Failed: ${error.message}`);
    process.exit(1);  // crash the app if DB fails - K8s will restart the pod
  }
};

module.exports = connectDB;


// Why process.exit(1) on failure?
// In Kubernetes, if a pod crashes, K8s automatically restarts it. So crashing intentionally on DB failure is actually the correct pattern — it forces a restart and retry rather than running in a broken state silently.