const { spawn } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const cloudflaredPath =
  process.env.CLOUDFLARED_PATH ??
  (process.platform === "win32"
    ? path.join(projectRoot, ".tools", "cloudflared.exe")
    : "cloudflared");
const expoCliPath = path.join(projectRoot, "node_modules", "expo", "bin", "cli");
const tunnelUrlPattern = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

let cloudflared;
let expo;
let stopping = false;
let tunnelStarted = false;
let tunnelOutput = "";

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  expo?.kill();
  cloudflared?.kill();
  setTimeout(() => process.exit(exitCode), 500).unref();
}

function startExpo(tunnelUrl) {
  if (tunnelStarted) return;
  tunnelStarted = true;

  console.log(`\nPublic Metro tunnel: ${tunnelUrl}`);
  console.log("Starting Expo. Keep this terminal open while using Expo Go.\n");

  expo = spawn(
    process.execPath,
    [expoCliPath, "start", "--lan", "--clear", "--port", "8081"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        EXPO_PACKAGER_PROXY_URL: tunnelUrl,
      },
      stdio: "inherit",
    }
  );

  expo.on("exit", (code) => stop(code ?? 0));
  expo.on("error", (error) => {
    console.error(`Unable to start Expo: ${error.message}`);
    stop(1);
  });
}

function inspectTunnelOutput(chunk) {
  const output = chunk.toString();
  process.stderr.write(output);
  if (tunnelStarted) return;

  tunnelOutput += output;
  const match = tunnelOutput.match(tunnelUrlPattern);
  if (match) {
    tunnelOutput = "";
    startExpo(match[0]);
  }
}

console.log("Starting a temporary Cloudflare tunnel (no account required)...");

cloudflared = spawn(
  cloudflaredPath,
  [
    "tunnel",
    "--url",
    "http://127.0.0.1:8081",
    "--no-autoupdate",
    "--protocol",
    "http2",
  ],
  { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"] }
);

cloudflared.stdout.on("data", inspectTunnelOutput);
cloudflared.stderr.on("data", inspectTunnelOutput);
cloudflared.on("error", (error) => {
  console.error(`Unable to start Cloudflare Tunnel: ${error.message}`);
  stop(1);
});
cloudflared.on("exit", (code) => {
  if (!stopping) {
    console.error(`Cloudflare Tunnel stopped unexpectedly (exit ${code ?? "unknown"}).`);
    stop(code || 1);
  }
});

const timeout = setTimeout(() => {
  if (!tunnelStarted) {
    console.error("Cloudflare did not provide a tunnel URL within 30 seconds.");
    stop(1);
  }
}, 30_000);
timeout.unref();

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
