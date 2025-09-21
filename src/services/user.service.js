// src/services/userService.js
import Joi from "joi";
import MongoUserRepository from "../repos/implementations/mongoUserRepo.js";
import RedisCacheRepository from "../repos/implementations/redisCacheRepo.js";
import AppError from "../utils/errors.js";
import jwt from "jsonwebtoken";

class UserService {
  constructor() {
    this.userRepository = new MongoUserRepository();
    this.cacheRepository = new RedisCacheRepository();
  }

  // Validation schema for user creation
  createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid("Admin", "Candidate", "Client").required(),
    name: Joi.string().min(2).required(),
  });

  // Validation schema for user update
  updateUserSchema = Joi.object({
    email: Joi.string().email(),
    name: Joi.string().min(2),
    role: Joi.string().valid("Admin", "Candidate", "Client"),
  });

  register = async (userData) => {
    // Validate input
    const { error } = this.createUserSchema.validate(userData);
    if (error) throw new AppError(error.message, 400);

    // Check if email exists
    const cacheKey = `user:email:${userData.email}`;
    let existingUser = await this.cacheRepository.get(cacheKey);
    if (!existingUser) {
      existingUser = await this.userRepository.findUserByEmail(userData.email);
      if (existingUser)
        await this.cacheRepository.set(cacheKey, existingUser, 3600); // Cache for 1 hour
    }
    if (existingUser) throw new AppError("Email already exists", 409);

    // Create user
    const user = await this.userRepository.createUser(userData);

    // Cache user by ID and email
    await this.cacheRepository.set(
      `user:id:${user._id}`,
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      3600
    );
    await this.cacheRepository.set(cacheKey, user, 3600);

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      token,
    };
  };

  login = async ({ email, password }) => {
    // Validate input
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });
    const { error } = schema.validate({ email, password });
    if (error) throw new AppError(error.message, 400);

    // Find user
    const cacheKey = `user:email:${email}`;
    let user = await this.userRepository.findUserByEmail(email);
    if (!user) throw new AppError("Invalid credentials", 401);

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError("Invalid credentials", 401);

    // Cache user by ID
    await this.cacheRepository.set(
      `user:id:${user._id}`,
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      3600
    );

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      token,
    };
  };

  getUser = async (id) => {
    // Check cache first
    const cacheKey = `user:id:${id}`;
    let user = await this.cacheRepository.get(cacheKey);
    if (!user) {
      user = await this.userRepository.findUserById(id);
      if (!user) throw new AppError("User not found", 404);
      await this.cacheRepository.set( 
        cacheKey,
        {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        3600
      );
    }
    return user;
  };

  updateUser = async (id, userData) => {
    // Validate input
    const { error } = this.updateUserSchema.validate(userData);
    if (error) throw new AppError(error.message, 400);

    const user = await this.userRepository.updateUser(id, userData);
    if (!user) throw new AppError("User not found", 404);

    // Update cache
    await this.cacheRepository.set(
      `user:id:${id}`,
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      3600
    );
    if (userData.email) {
      await this.cacheRepository.set(`user:email:${user.email}`, user, 3600);
      if (userData.email !== user.email) {
        await this.cacheRepository.del(`user:email:${userData.email}`);
      }
    }

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  };
}

export default UserService;
