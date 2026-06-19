import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { allowedStatuses, projectsPath, registryPath, root } from "./lib.mjs";

const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

async function validateLocalReferences(html, projectDir, slug) {
  const attributes = html.matchAll(/\b(?:src|href)=["']([^"'#?]+)["']/gi);
  for (const [, reference] of attributes) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)) continue;
    if (reference.startsWith("/")) {
      errors.push(`${slug}: root-relative reference "${reference}" may escape the project folder`);
      continue;
    }
    const filePath = path.resolve(projectDir, decodeURIComponent(reference));
    if (!filePath.startsWith(`${projectDir}${path.sep}`) && filePath !== projectDir) {
      errors.push(`${slug}: reference escapes project folder: ${reference}`);
      continue;
    }
    try { await access(filePath); } catch { errors.push(`${slug}: missing local file: ${reference}`); }
  }
}

async function main() {
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  check(Array.isArray(registry), "data/projects.json must contain an array");
  if (!Array.isArray(registry)) throw new Error(errors.join("\n"));

  const seen = new Set();
  for (const project of registry) {
    check(typeof project.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug), `Invalid slug: ${project.slug}`);
    check(!seen.has(project.slug), `Duplicate slug: ${project.slug}`);
    seen.add(project.slug);
    check(typeof project.title === "string" && project.title.trim(), `${project.slug}: missing title`);
    check(typeof project.description === "string" && project.description.trim(), `${project.slug}: missing description`);
    check(allowedStatuses.has(project.status), `${project.slug}: invalid status ${project.status}`);
    check(typeof project.pinned === "boolean", `${project.slug}: pinned must be boolean`);
    check(!Number.isNaN(Date.parse(project.publishedAt)), `${project.slug}: invalid publishedAt`);
    check(!Number.isNaN(Date.parse(project.updatedAt)), `${project.slug}: invalid updatedAt`);
    check(project.path === `/projects/${project.slug}/`, `${project.slug}: path does not match slug`);

    const projectDir = path.join(projectsPath, project.slug);
    try {
      const html = await readFile(path.join(projectDir, "index.html"), "utf8");
      check(/<title[^>]*>[^<]+<\/title>/i.test(html), `${project.slug}: index.html has no title`);
      await validateLocalReferences(html, projectDir, project.slug);
    } catch {
      errors.push(`${project.slug}: projects/${project.slug}/index.html is missing`);
    }
  }

  let directories = [];
  try {
    directories = (await readdir(projectsPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name);
  } catch {}
  for (const directory of directories) check(seen.has(directory), `Unregistered project directory: ${directory}`);

  for (const file of ["index.html", "app.js", "styles.css"]) {
    try { await access(path.join(root, file)); } catch { errors.push(`Dashboard file missing: ${file}`); }
  }

  if (errors.length) throw new Error(`Validation failed:\n- ${errors.join("\n- ")}`);
  console.log(`Validation passed for ${registry.length} project(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
