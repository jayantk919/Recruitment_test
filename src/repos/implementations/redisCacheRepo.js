// src/repositories/implementations/redisCacheRepository.js
import ICacheRepository from '../contracts/ICacheRepo.js'
import redis  from '../../config/redis.js'
import AppError from '../../utils/errors.js'

class RedisCacheRepository extends ICacheRepository {
  async get(key) {
    try {
      const data = await redis.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch {
        return data; // fallback if not JSON
      }
    } catch (error) {
      throw new AppError('Failed to get cache', 500, error);
    }
  }

  async set(key, value, ttl) {
    try {
      if (ttl) {
        await redis.set(key, JSON.stringify(value), "EX", ttl);
      } else {
        await redis.set(key, JSON.stringify(value));
      }
    } catch (error) {
      throw new AppError('Failed to set cache', 500, error);
    }
  }

  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      throw new AppError('Failed to delete cache', 500, error);
    }
  }
}


export default RedisCacheRepository;
