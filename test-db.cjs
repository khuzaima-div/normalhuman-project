const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

client
  .connect()
  .then(() => {
    console.log("DATABASE CONNECTED ✅");
    return client.end();
  })
  .catch((err) => {
    console.error("DATABASE ERROR ❌");
    console.error(err.message);
  });