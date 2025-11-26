import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../..");
const TURBO_JSON_PATH = resolve(ROOT_DIR, "turbo.json");

// Extract env var names from the schema files
function extractEnvVars(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const envVars: string[] = [];

  // Match patterns like: VAR_NAME: z.string()
  const regex = /^\s*([A-Z][A-Z0-9_]*)\s*:/gm;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    if (varName) {
      envVars.push(varName);
    }
  }

  return envVars;
}

function main() {
  const serverEnvPath = resolve(__dirname, "../src/server.ts");
  const clientEnvPath = resolve(__dirname, "../src/client.ts");

  const serverVars = extractEnvVars(serverEnvPath);
  const clientVars = extractEnvVars(clientEnvPath);

  // Read current turbo.json
  const turboJson = JSON.parse(readFileSync(TURBO_JSON_PATH, "utf-8"));

  // Update globalEnv with server variables
  turboJson.globalEnv = serverVars.sort();

  // Update build task with client variables (NEXT_PUBLIC_*)
  if (clientVars.length > 0) {
    turboJson.tasks = turboJson.tasks || {};
    turboJson.tasks.build = turboJson.tasks.build || {};
    turboJson.tasks.build.env = clientVars.sort();
  }

  // Write back with proper formatting
  writeFileSync(TURBO_JSON_PATH, JSON.stringify(turboJson, null, 2) + "\n");

  console.log("Updated turbo.json:");
  console.log(`  globalEnv: ${serverVars.length} server variables`);
  console.log(`  build.env: ${clientVars.length} client variables`);
  console.log("\nServer vars:", serverVars.join(", "));
  if (clientVars.length > 0) {
    console.log("Client vars:", clientVars.join(", "));
  }
}

main();
