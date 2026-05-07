import express from "express";
import { createServer } from "node:http";
import { registerRoutes } from "../server/routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = createServer(app);
const ready = registerRoutes(server, app);

export default async function handler(req: any, res: any) {
  await ready;
  return app(req, res);
}