// errorHandling.js

const errorHandler = (err, req, res, next) => {
    // Handle specific errors
    if (err.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation Error', errors: err.errors });
    } else {
      // Handle other errors
      res.status(500).json({ message: 'Internal Server Error' });
    }
  
    // Don't call next() here to prevent further execution of middleware chain
  };
  
  const notFound = (req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
  };
  
  module.exports = { errorHandler, notFound };
  