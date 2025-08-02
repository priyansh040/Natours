// 1. Load environment variables from .env file
import dotenv from 'dotenv';
// 2. Import required modules

dotenv.config();

import mongoose from 'mongoose';
import app from './app.js'; // Your main Express application

// 3. Prepare MongoDB connection string
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// 4. Connect to MongoDB using Mongoose
mongoose
  .connect(DB)
  .then(() => console.log('✅ DB connection successful!'))
  .catch((err) => console.error('❌ DB connection error:', err));

// 5. Start the server and listen on the specified port
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}...`);
});

// 6. Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// 7. Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
