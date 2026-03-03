import Redis from 'ioredis';
import { env } from './env';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connecté');
});

redis.on('error', (err) => {
  console.error('❌ Redis erreur:', err.message);
});

export default redis;
