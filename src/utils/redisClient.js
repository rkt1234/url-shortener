const { createClient } = require('redis');

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

client.on('error', err => console.log('Redis Client Error', err));

async function connectRedis() {
  await client.connect();
  console.log('✅ Redis connected');
}

connectRedis();

module.exports = client;
