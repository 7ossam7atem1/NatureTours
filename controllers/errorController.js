const AppError = require('../Utils/appError');

const handleJWTTokenExpiredError = () =>
  new AppError('Token is expired, please try to login Again', 401);

const handleJWTError = () =>
  new AppError('Invalid Token, Please Login Again!', 401);

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

// const handleDuplicateFieldsDB = (err) => {
//   const { name } = err.keyValue;
//   const message = `Duplicate field value: "${name}" please use different value`;
//   return new AppError(message, 400);
// };

//the most correct one till now
const handleDuplicateFieldsDB = (err) => {
  const keys = Object.keys(err.keyValue);
  const field = keys.length > 0 ? keys[0] : 'field';
  const message = `Duplicate field value: ${field} please use different value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errorMessages = Object.keys(err.errors).map((key) => {
    const error = err.errors[key];
    return `${error.message}`;
  });

  const errorMessage = `Invalid input Data : ${errorMessages.join('. ')}`;
  return new AppError(errorMessage, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Operational, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming error or other unknown error not marked as operational: we don't want to leak details to the client
  } else {
    // 1) log the error
    console.error('ERROR💥', err);
    // 2) send message to the client
    res.status(500).json({
      status: 'Error',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTTokenExpiredError();
    sendErrorProd(error, res);
  }
};

