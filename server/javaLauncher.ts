import { spawn, spawnSync, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import http from "http";
import type { Request, Response } from "express";

let javaProcess: ChildProcess | null = null;
let isJavaAvailable = false;
let isSpringReady = false;

/**
 * Check whether 'java' runtime exists in system PATH
 */
export function checkJavaInstalled(): boolean {
  try {
    const res = spawnSync("java", ["-version"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Locate Maven binary or wrapper script
 */
export function findMavenCommand(backendDir: string): { cmd: string; args: string[] } | null {
  const isWin = process.platform === "win32";

  // 1. Check if global 'mvn' / 'mvn.cmd' exists
  try {
    const res = spawnSync(isWin ? "mvn.cmd" : "mvn", ["-v"], { stdio: "ignore" });
    if (res.status === 0) {
      return { cmd: isWin ? "mvn.cmd" : "mvn", args: [] };
    }
  } catch {}

  // 2. Check for local Maven Wrapper (mvnw or mvnw.cmd)
  const wrapperScript = isWin ? path.join(backendDir, "mvnw.cmd") : path.join(backendDir, "mvnw");
  if (fs.existsSync(wrapperScript)) {
    return { cmd: wrapperScript, args: [] };
  }

  return null;
}

/**
 * Periodically probe http://127.0.0.1:8080/api/trips to detect when Spring Boot is fully initialized
 */
export function startSpringHealthProbe() {
  if (!checkJavaInstalled()) {
    isSpringReady = false;
    return;
  }

  const interval = setInterval(() => {
    if (!javaProcess) {
      isSpringReady = false;
      return;
    }

    const req = http.get("http://127.0.0.1:8080/api/trips", (res) => {
      const serverHeader = String(res.headers["server"] || "").toLowerCase();
      const contentTypeHeader = String(res.headers["content-type"] || "").toLowerCase();
      const isNotNginx = !serverHeader.includes("nginx");
      const isJson = contentTypeHeader.includes("application/json");
      if (res.statusCode === 200 && isNotNginx && isJson) {
        if (!isSpringReady) {
          isSpringReady = true;
          console.log("\x1b[32m[TripNest ☕ Java]\x1b[0m Spring Boot 3.2 is LIVE on http://localhost:8080 and ready for traffic!\x1b[0m");
        }
      } else {
        isSpringReady = false;
      }
    });
    req.on("error", () => {
      isSpringReady = false;
    });
    req.setTimeout(800, () => {
      req.destroy();
    });
  }, 2500);

  interval.unref();
}

/**
 * Starts the Java Spring Boot backend concurrently if Java is installed
 */
export function startJavaBackend(): void {
  const backendDir = path.resolve(process.cwd(), "backend-java");

  if (!fs.existsSync(backendDir)) {
    return;
  }

  isJavaAvailable = checkJavaInstalled();

  if (!isJavaAvailable) {
    console.log("");
    console.log("\x1b[36m╭─────────────────────────────────────────────────────────────────────────────╮\x1b[0m");
    console.log("\x1b[36m│\x1b[0m \x1b[1m☕ TripNest Concurrent Full-Stack Runner\x1b[0m                                   \x1b[36m│\x1b[0m");
    console.log("\x1b[36m├─────────────────────────────────────────────────────────────────────────────┤\x1b[0m");
    console.log("\x1b[36m│\x1b[0m • Web Client & Active API Server: \x1b[32mhttp://localhost:3000\x1b[0m                     \x1b[36m│\x1b[0m");
    console.log("\x1b[36m│\x1b[0m • Java 17+ was not found on your system PATH.                               \x1b[36m│\x1b[0m");
    console.log("\x1b[36m│\x1b[0m   (Running with embedded high-performance Node API engine)                  \x1b[36m│\x1b[0m");
    console.log("\x1b[36m│\x1b[0m • To also run the Java Spring Boot service automatically:                   \x1b[36m│\x1b[0m");
    console.log("\x1b[36m│\x1b[0m   Install Java 17+ and Maven on your machine. Next time you run             \x1b[36m│\x1b[0m");
    console.log("\x1b[36m│\x1b[0m   \x1b[33mnpm run dev\x1b[0m, both the web server AND Java backend boot up together!       \x1b[36m│\x1b[0m");
    console.log("\x1b[36m╰─────────────────────────────────────────────────────────────────────────────╯\x1b[0m");
    console.log("");
    return;
  }

  const maven = findMavenCommand(backendDir);

  if (!maven) {
    console.log("\x1b[33m[TripNest Java]\x1b[0m Java runtime found, but Maven ('mvn') was not located.");
    console.log("\x1b[33m[TripNest Java]\x1b[0m Install Maven to enable automatic Spring Boot launching.");
    return;
  }

  console.log("");
  console.log("\x1b[35m╭─────────────────────────────────────────────────────────────────────────────╮\x1b[0m");
  console.log("\x1b[35m│\x1b[0m \x1b[1m☕ Launching Java Spring Boot Backend (Port 8080)...\x1b[0m                        \x1b[35m│\x1b[0m");
  console.log(`\x1b[35m│\x1b[0m Command: \x1b[33m${maven.cmd} spring-boot:run\x1b[0m in backend-java                            \x1b[35m│\x1b[0m`);
  console.log("\x1b[35m│\x1b[0m Both Web (3000) and Java (8080) are executing simultaneously!               \x1b[35m│\x1b[0m");
  console.log("\x1b[35m╰─────────────────────────────────────────────────────────────────────────────╯\x1b[0m");
  console.log("");

  try {
    const command = process.platform === "win32" ? `"${maven.cmd}"` : maven.cmd;
    javaProcess = spawn(command, [...maven.args, "spring-boot:run"], {
      cwd: backendDir,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        SERVER_PORT: "8080"
      }
    });

    startSpringHealthProbe();

    javaProcess.stdout?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.trim().length > 0) {
          console.log(`\x1b[35m[Java 8080]\x1b[0m ${line}`);
        }
      }
    });

    javaProcess.stderr?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.trim().length > 0) {
          console.error(`\x1b[33m[Java 8080 ERR]\x1b[0m ${line}`);
        }
      }
    });

    javaProcess.on("close", (code) => {
      isSpringReady = false;
      console.log(`\x1b[35m[Java 8080]\x1b[0m Process exited with code ${code}`);
    });

    javaProcess.on("error", (err) => {
      isSpringReady = false;
      console.warn(`\x1b[33m[TripNest Java]\x1b[0m Failed to spawn Java backend: ${err.message}`);
    });
  } catch (err: any) {
    console.warn(`\x1b[33m[TripNest Java]\x1b[0m Launch error: ${err.message}`);
  }

  // Graceful shutdown handler
  const shutdown = () => {
    if (javaProcess && !javaProcess.killed) {
      console.log("\x1b[35m[TripNest]\x1b[0m Stopping Java Spring Boot backend process...");
      try {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/pid", String(javaProcess.pid), "/f", "/t"]);
        } else {
          javaProcess.kill("SIGTERM");
        }
      } catch {}
    }
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit();
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit();
  });
}

/**
 * Transparently forward an HTTP request to the running Java Spring Boot instance
 */
export async function forwardToJava(
  req: Request,
  res: Response,
  targetPath: string
): Promise<boolean> {
  if (!isJavaAvailable || !isSpringReady || !javaProcess) {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const url = new URL(`http://127.0.0.1:8080${targetPath}`);
    // Append query params
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        url.searchParams.append(key, value);
      }
    }

    const options: http.RequestOptions = {
      method: req.method,
      hostname: "127.0.0.1",
      port: 8080,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        Accept: req.headers["accept"] || "application/json"
      },
      timeout: 2000
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode || 200);
      res.setHeader("x-served-by", "java-spring-boot");
      for (const [hKey, hVal] of Object.entries(proxyRes.headers)) {
        if (hVal && hKey !== "transfer-encoding") {
          res.setHeader(hKey, hVal);
        }
      }
      proxyRes.pipe(res);
      resolve(true);
    });

    proxyReq.on("error", () => {
      resolve(false);
    });

    proxyReq.on("timeout", () => {
      proxyReq.destroy();
      resolve(false);
    });

    if (req.body && Object.keys(req.body).length > 0) {
      proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
  });
}

export function getJavaStatus() {
  return {
    javaInstalled: isJavaAvailable,
    springBootReady: isSpringReady,
    backendPort: 8080
  };
}
