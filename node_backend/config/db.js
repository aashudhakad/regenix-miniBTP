// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

// .env.example
// PORT=5000
// MONGODB_URI="mongodb://localhost:27017/regenix"
// JWT_SECRET=your_jwt_secret_key
// JWT_EXPIRE="30d"
// NODE_ENV=development
