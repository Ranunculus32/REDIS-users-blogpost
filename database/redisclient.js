

const { createClient } = require("redis");
require("dotenv").config();

console.log("Before creating redisClient");
const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 19347,
  },
});



console.log("After creating redisClient");

module.exports = { redisClient };
