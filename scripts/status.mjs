import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { parseArgs, registryPath, root, updateProjectStatus } from "./lib.mjs";

const execFileAsync = promisify(execFile);

function usage() {
  return `Usage:
  npm run status -- --slug <project-slug> --status <active|inactive|complete|archived>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug || !args.status) throw new Error(usage());

  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const project = updateProjectStatus(registry, args.slug, args.status);
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  const validation = await execFileAsync(process.execPath, [path.join(root, "scripts", "validate.mjs")], { cwd: root });
  console.log(`${project.title}: ${project.status}`);
  console.log(validation.stdout.trim());
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
