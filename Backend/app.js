// import express from 'express';
// import cors from 'cors';
// import categoryRoutes from './routes/Category/CategoryRoutes.js';
// import { errorHandler, notFound } from './middlewares/error.middleware.js';

// const app = express();

// // Middlewares
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Static files for uploads
// app.use('/uploads', express.static('uploads'));

// // Routes
// app.use('/api/categories', categoryRoutes);

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', timestamp: new Date().toISOString() });
// });

// // Error handling
// app.use(notFound);
// app.use(errorHandler);

// export default app;