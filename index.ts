import express, { type Request, type Response } from 'express';

const app = express();
const port: number = 3000;

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
