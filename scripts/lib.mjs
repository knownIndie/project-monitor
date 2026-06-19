import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..");
export const registryPath = path.join(root, "data", "projects.json");
export const projectsPath = path.join(root, "projects");
export const allowedStatuses = new Set(["active", "inactive", "complete", "archived"]);

export function slugify(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (key === "pinned") {
      result.pinned = true;
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    result[key] = value;
    index += 1;
  }
  return result;
}

export function updateProjectStatus(registry, slug, status, updatedAt = new Date().toISOString()) {
  if (!allowedStatuses.has(status)) throw new Error(`Invalid status: ${status}`);
  const project = registry.find((item) => item.slug === slug);
  if (!project) throw new Error(`Unknown project: ${slug}`);
  project.status = status;
  project.updatedAt = updatedAt;
  return project;
}
