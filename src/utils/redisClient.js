const { createClient } = require('redis');

const client = createClient({
  username: 'default',
  password: 'XJ3hB3dnKDVepLfFAtGBMUYhWBnxeC3W',
  socket: {
    host: 'redis-15927.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
    port: 15927
  }
});

client.on('error', err => console.log('Redis Client Error', err));

async function connectRedis() {
  await client.connect();
  console.log('✅ Redis connected');

  // Optional: test connection
  // await client.set('foo', 'bar');
  // const result = await client.get('foo');
  // console.log(result);  // >>> bar
}

connectRedis();

module.exports = client;
