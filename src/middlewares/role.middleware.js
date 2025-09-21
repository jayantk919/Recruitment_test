// src/middlewares/role.js
import AppError from '../utils/errors.js'

const userRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new AppError('Access denied: insufficient permissions', 403);
  }
  next();
};

export default userRole