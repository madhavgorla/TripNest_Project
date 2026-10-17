import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const serverTsPath = path.join(rootDir, "server.ts");
const appTsPath = path.join(rootDir, "app.ts");

if (!fs.existsSync(serverTsPath)) {
  console.error("server.ts not found at", serverTsPath);
  process.exit(1);
}

const serverCode = fs.readFileSync(serverTsPath, "utf-8");

// 1. Remove Vite import
let appCode = serverCode.replace(
  /import\s*\{\s*createServer\s+as\s+createViteServer\s*\}\s*from\s*["']vite["'];?/g,
  ""
);

// 2. Remove 'async function startServer() {' and 'const PORT = ...;'
appCode = appCode.replace(
  /async\s+function\s+startServer\s*\(\)\s*\{[\s\S]*?const\s+PORT\s*=\s*[^;]+;/m,
  "const app = express();"
);

// 3. Remove start-up hooks that shouldn't run at module top-level in serverless
appCode = appCode.replace(/await\s+initPostgresTables\(\);/g, "// initPostgresTables() handled in serverless handler");
appCode = appCode.replace(/startJavaBackend\(\);/g, "// startJavaBackend() disabled in serverless");

// 4. Inject Netlify prefix rewrite middleware after CORS headers
const corsEndMarker = 'if (req.method === "OPTIONS") {\n      return res.sendStatus(200);\n    }\n    next();\n  });';
const netlifyRewrite = `if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Netlify Functions path prefix rewrite handler:
  // Normalizes '/.netlify/functions/api/...' -> '/api/...'
  app.use((req: Request, res: Response, next) => {
    if (req.url.startsWith("/.netlify/functions/api")) {
      const stripped = req.url.slice("/.netlify/functions/api".length);
      req.url = stripped ? (stripped.startsWith("/") ? \`/api\${stripped}\` : \`/api/\${stripped}\`) : "/api";
    }
    next();
  });`;

if (appCode.includes(corsEndMarker)) {
  appCode = appCode.replace(corsEndMarker, netlifyRewrite);
}

// 5. Replace Vite dev server & app.listen with export of app
const viteServingRegex = /\/\/\s*Vite Dev Server[\s\S]*$/m;
const fallbackListenRegex = /if\s*\(process\.env\.NODE_ENV\s*!==\s*["']production["']\)[\s\S]*$/m;

if (viteServingRegex.test(appCode)) {
  appCode = appCode.replace(viteServingRegex, "export { app };\nexport default app;\n");
} else if (fallbackListenRegex.test(appCode)) {
  appCode = appCode.replace(fallbackListenRegex, "export { app };\nexport default app;\n");
}

// 6. Update 404 handler to also match /.netlify/functions/api/*
appCode = appCode.replace(
  /app\.all\(\s*['"]\/api\/\*['"],/g,
  "app.all(['/api/*', '/.netlify/functions/api/*'],"
);

fs.writeFileSync(appTsPath, appCode, "utf-8");
console.log("Successfully generated app.ts from server.ts for Netlify serverless deployment!");
