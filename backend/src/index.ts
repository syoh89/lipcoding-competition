import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { initializeDatabase } from './database/init';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import mentorRoutes from './routes/mentor';
import matchRequestRoutes from './routes/matchRequest';
import feedbackRoutes from './routes/feedback';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 8088;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/images', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', mentorRoutes);
app.use('/api', matchRequestRoutes);
app.use('/api', feedbackRoutes);

// OpenAPI documentation
try {
  const yamlPath = path.join(__dirname, '../../openapi.yaml');
  console.log('Loading OpenAPI spec from:', yamlPath);
  const swaggerDocument = YAML.load(yamlPath);
  console.log('OpenAPI spec loaded successfully. Feedback paths:', swaggerDocument.paths['/feedback'] ? 'found' : 'not found');
  
  // Basic Swagger UI setup
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));
  
  // Serve OpenAPI spec as JSON
  app.get('/openapi.json', (req, res) => {
    res.json(swaggerDocument);
  });
  
  // Redirect root to Swagger UI
  app.get('/', (req, res) => {
    res.redirect('/api-docs');
  });
} catch (error) {
  console.error('Could not load OpenAPI documentation:', error);
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`📋 OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
