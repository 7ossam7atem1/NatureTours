const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./Utils/appError');
const globalErorrHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//serving static files
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(`${__dirname}/public`));
// app.use(express.static(`${__dirname}/public/img/images`));
// 1)GLOBAL Middlewares
//Set security http headers
// app.use(helmet());
const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org'];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  }),
);

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Limit requests to a certain route from same API
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message:
    'too many concurrent requests from this IP, please try again in an hour.',
});

app.use('/api', limiter);
//body parser reading data from the body into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);
app.use(cookieParser());
//Performing data sanitization against nosql query injection attacks
app.use(mongoSanitize());
//Performing data sanitization against cross-site-scripting attacks XSS
// app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErorrHandler);
// 4) Starting the server
module.exports = app;

//for the use of xss you need to make a special module in utils for it as foloows:

//   const xss = require('xss');
// function filterObj(obj, ...allowedFields) {
//   const filteredObj = {};
//   Object.keys(obj).forEach((el) => {
//     if (allowedFields.includes(el)) filteredObj[el] = xss(obj[el]);
//   });
//   return filteredObj;
// }

// import filterObj from '../utils/filterObj.js';
// ...
// export const signup = catchAsync(async function (req, res, next) {
//   const filteredBody = filterObj(
//     req.body,
//     'name',
//     'email',
//     'password',
//     'passwordConfirm',
//     'role'
//   );

//   const newUser = await User.create(filteredBody);
