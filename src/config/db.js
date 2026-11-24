const mongoose = require('mongoose');
const env = require('./env');

// Solo se aceptan en los filtros los campos definidos en el esquema.
// La inyección de operadores ($gt, $ne...) se bloquea en el middleware
// sanitize.js y convirtiendo a String los valores que llegan del usuario.
mongoose.set('strictQuery', true);

async function connectDB(uri = env.MONGO_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] Conectado a MongoDB (${mongoose.connection.name})`);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
