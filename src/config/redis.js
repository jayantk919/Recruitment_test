// src/config/redis.js
import Redis from 'ioredis'

const redis = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
})

redis.on('connect', ()=>{
    console.log('Connected to Redis...🧧')    
})

export default redis