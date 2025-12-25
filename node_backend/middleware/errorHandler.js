const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  };
  
  module.exports = { errorHandler };
  

// middleware/errorHandler.js
// const errorHandler = (err, req, res, next) => {
//   console.error(err.stack);
  
//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     const messages = Object.values(err.errors).map(val => val.message);
//     return res.status(400).json({ error: messages.join(', ') });
//   }
  
//   // Mongoose duplicate key error
//   if (err.code === 11000) {
//     return res.status(400).json({ error: 'Duplicate field value entered' });
//   }
  
//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     return res.status(401).json({ error: 'Invalid token' });
//   }
  
//   if (err.name === 'TokenExpiredError') {
//     return res.status(401).json({ error: 'Token expired' });
//   }
  
//   // Default server error 
//   res.status(err.statusCode || 500).json({
//     error: err.message || 'Server error'
//   });
// };

// module.exports = errorHandler;
