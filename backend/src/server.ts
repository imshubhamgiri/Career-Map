import app from './app';
import { env } from './config/env';

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`Received ${signal}. Gracefully terminating HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed successfully.');
    process.exit(0);
  });

  // Force close if connections take longer than 10 seconds
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing shutdown.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
