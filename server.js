// 1. Load environment variables from .env file (e.g., DB credentials, port)
// This should be done at the very beginning
const dotenv = require('dotenv');

dotenv.config();

// 2. Import required modules
const mongoose = require('mongoose'); // Mongoose for MongoDB connection
const app = require('./app'); // Your main Express application

// 3. Prepare MongoDB connection string
// Replace placeholder <PASSWORD> with actual password from environment variables
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// 4. Connect to MongoDB using Mongoose
// This establishes a connection to your cloud/local database
mongoose
  .connect(DB)
  .then(() => console.log('✅ DB connection successful!'))
  .catch((err) => console.error('❌ DB connection error:', err));

// 5. Start the server and listen on the specified port
// Fallback to port 3000 if not defined in .env
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}...`);
});

// 6. Handle unhandled promise rejections
// Example: failed database connection or any async operation without .catch()
// Gracefully shut down the server
process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); // Exit the process with failure
  });
});

// 7. Handle uncaught exceptions (synchronous errors not caught anywhere)
// Example: undefined variable, sync code error
process.on('uncaughtException', (err) => {
  console.log('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); // Exit the process with failure
  });
});
