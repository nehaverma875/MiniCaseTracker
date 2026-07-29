import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDb } from './config/db.js';

dotenv.config();

const port = process.env.PORT || 3500;

connectDb()
  .then(() => {
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
