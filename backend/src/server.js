import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🏥 ===================================');
  console.log(`🚀 Klinik Sentosa API Server`);
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🏥 ===================================\n');
  console.log('📌 Available endpoints:');
  console.log('   GET  /health - Health check');
  console.log('   POST /api/auth/login - Login');
  console.log('   GET  /api/auth/me - Get current user');
  console.log('   GET  /api/patients - Get all patients');
  console.log('   POST /api/patients - Create patient (auto-add to queue)');
  console.log('   GET  /api/queue - Get queue');
  console.log('   GET  /api/medicines - Get medicines');
  console.log('   POST /api/transactions - Create payment');
  console.log('\n✅ Server is ready!\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
