// in express many packages depend on special variable node_env
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.error('DB connection error:', err));

const app = require('./app');
// console.log(process.env);

const port = 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
