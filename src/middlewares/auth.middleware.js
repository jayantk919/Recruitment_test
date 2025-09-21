// src/middlewares/auth.js
import jwt from 'jsonwebtoken'
import AppError from '../utils/errors.js'


const authUser =  (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication token required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

export default authUser