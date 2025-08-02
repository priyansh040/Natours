// Core dependencies
import express from 'express';
import morgan from 'morgan';
import qs from 'qs';
import helmet from 'helmet';
// import mongoSanitize from 'express-mongo-sanitize';
// import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Custom modules
import tourRouter from './routes/tourRoute.js';
import userRouter from './routes/userRoute.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

// Simulate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

/* -------------------------------------------------------------------------- */
/*                         1) GLOBAL MIDDLEWARES                              */
/* -------------------------------------------------------------------------- */

app.use(helmet());

app.set('query parser', (str) => qs.parse(str));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

// Uncomment when needed:
// app.use(mongoSanitize());
// app.use(xss());

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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------------------------------------------------------- */
/*                                2) ROUTES                                   */
/* -------------------------------------------------------------------------- */

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

/* -------------------------------------------------------------------------- */
/*                          3) UNHANDLED ROUTES                               */
/* -------------------------------------------------------------------------- */

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

/* -------------------------------------------------------------------------- */
/*                          4) GLOBAL ERROR HANDLER                           */
/* -------------------------------------------------------------------------- */

app.use(globalErrorHandler);

// Export the app
export default app;
