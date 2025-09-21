// src/index.js
import 'dotenv/config';
import express from 'express'
import connectDB from './src/config/database.js';
import router from './src/routes/user.route.js';
import userModel from './src/models/user.model.js';

const app = express();

// Middleware
app.use(express.json());



// Routes
app.use('/api', router);

// Error Handler
// app.use(errorHandler);

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
};

startServer();
