// 1. Load environment variables first
const dotenv = require('dotenv');

dotenv.config();

// 2. Import dependencies
const mongoose = require('mongoose');
const app = require('./app');

// 3. Setup DB connection string using environment variables
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// 4. Connect to MongoDB using Mongoose
mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.error('DB connection error:', err));

// 5. Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
