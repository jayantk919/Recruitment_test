// src/routes/users.js
import express from 'express'
import userController from '../controllers/user.controller.js'
import authUser from '../middlewares/auth.middleware.js'
import userRole from '../middlewares/role.middleware.js'


const router = express.Router()
// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (require authentication)
router.get('/:id', authUser, userController.getUser);
router.put('/:id', authUser, userRole(['Admin']), userController.updateUser);

export default router;
