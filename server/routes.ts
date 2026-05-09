import type { Express, Request, Response } from "express";
import type { Server } from "node:http";
// Reuse the production Vercel handler so dev and prod behaviour stay identical.
// @ts-ignore — JS handler, no .d.ts
import handler from "../api/index.js";

/**
 * Express adapter that forwards every /api/* request to the Vercel-style
 * handler defined in api/index.js. This keeps a single source of truth for
 * routing and ensures dev mode hits the same Postgres-backed code paths as
 * the deployed serverless function.
 */
export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.all(/^\/api\/.*/, async (req: Request, res: Response) => {
    try {
      // Build a request shape the Vercel handler expects.
      const proxiedReq = {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        headers: req.headers,
      } as unknown as Parameters<typeof handler>[0];
      await handler(proxiedReq, res as unknown as Parameters<typeof handler>[1]);
    } catch (err) {
      console.error("API handler error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
      }
    }
  });

  return httpServer;
}
