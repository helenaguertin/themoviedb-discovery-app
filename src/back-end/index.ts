import express from 'express';
import { registerHealthApi } from './health-api';
import { registerMoviesApi } from './movies-api';

// Create a new express application instance
const app = express();

// Define the port number for the server to listen on
const port: number = 3000;

// Register API routes from dedicated modules
registerHealthApi(app);
registerMoviesApi(app);

// Keep the existing root endpoint available
app.get('/', (_req: express.Request, res: express.Response) => {
  res.send('Hello World from TypeScript!');
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Example app in TypeScript listening on port ${port}`);
});
