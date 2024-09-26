const express = require('express');
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require('xss-clean');
const hpp = require("hpp");


const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require("./routes/reviewRoutes");

const app = express();

// set security http headers
app.use(helmet());

// Global Middlewares

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


// limiting request per hour, i can make it 1000/10000 as per my app demands
const limiter = rateLimit ({
max: 100,
windowMs: 60*60*1000,
message: "Too many requrest from this ip! Please try again in an hour!"

});

app.use( "/api", limiter);

// body parser, reading data from the body into req.body
app.use(express.json({limit:"10kb"}));


// Data sanitization against NoSQL query injection adn cross site scripting attack! Cleaning data after reading data
app.use(mongoSanitize());

// Data sanitization agaisnt XSS
app.use(xss());

// Prevent parameter plution
app.use(hpp( /* { whitelist: ["duration", "price", "ratingsQuantity"]  } */ ) );  // white list your parameters as array of property which we allow duplicate in our query string.

// serving static files
app.use(express.static(`${__dirname}/public`));



// test middleware
app.use((req,res,next) => {
req.requstTime= new Date().toISOString();
next();
});


app.get('/test', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Test route works!' });
  });


// Mount Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


app.all('*', (req, res, next) => {

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));

});

app.use(globalErrorHandler);

module.exports = app;
