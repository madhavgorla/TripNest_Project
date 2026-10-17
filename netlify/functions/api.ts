import serverless from "serverless-http";
import type { Handler } from "@netlify/functions";
import { app } from "../../app";
import { initPostgresTables } from "../../server/db";

let dbInitialized = false;

const serverlessApp = serverless(app, {
  binary: ["image/*", "application/pdf", "application/octet-stream"]
});

export const handler: Handler = async (event, context) => {
  // Cold start migration / schema check (noop if DATABASE_URL is not set)
  if (!dbInitialized) {
    try {
      await initPostgresTables();
    } catch (err) {
      console.warn("[Netlify Function] Database initialization warning:", err);
    }
    dbInitialized = true;
  }

  // Normalize path if Netlify function was invoked with function prefix or directly
  const normalizePath = (p?: string): string | undefined => {
    if (!p) return p;
    if (p.startsWith("/.netlify/functions/api")) {
      const stripped = p.slice("/.netlify/functions/api".length);
      return stripped ? (stripped.startsWith("/") ? `/api${stripped}` : `/api/${stripped}`) : "/api";
    }
    if (!p.startsWith("/api")) {
      return p.startsWith("/") ? `/api${p}` : `/api/${p}`;
    }
    return p;
  };

  if (event.path) {
    event.path = normalizePath(event.path) || event.path;
  }
  if ((event as any).rawPath) {
    (event as any).rawPath = normalizePath((event as any).rawPath);
  }
  if ((event as any).requestPath) {
    (event as any).requestPath = normalizePath((event as any).requestPath);
  }

  return (serverlessApp as any)(event, context);
};
