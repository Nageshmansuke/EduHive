export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File Upload Error',
      message: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this information already exists'
    });
  }

  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Never leak internal error details (stack traces, driver messages, etc.)
  // to clients in production for unexpected 5xx errors.
  const message = (status >= 500 && isProduction)
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  res.status(status).json({
    error: message,
    ...(!isProduction && { stack: err.stack })
  });
};
