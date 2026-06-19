import { cp, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { allowedStatuses, parseArgs, projectsPath, registryPath, root, slugify } from "./lib.mjs";

const execFileAsync = promisify(execFile);

function usage() {
  return `Usage:
  npm run publish -- --source /absolute/path --title "Project title" [options]

Options:
  --slug <stable-slug>          Required when intentionally updating an existing project
  --description <text>         Defaults to the HTML meta description
  --status <status>             active (default), complete, or archived
  --source-repository <url>     Optional source repository URL
  --pinned                      Keep above unpinned projects`;
}

function htmlMetadata(html) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim()
    ?? html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i)?.[1]?.trim();
  return { title, description };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source) throw new Error(`${usage()}\n\nMissing --source.`);

  const source = path.resolve(args.source);
  const sourceStat = await stat(source);
  const sourceDirectory = sourceStat.isDirectory() ? source : path.dirname(source);
  const sourceIndex = sourceStat.isDirectory() ? path.join(source, "index.html") : source;
  if (path.extname(sourceIndex).toLowerCase() !== ".html") throw new Error("The source file must be HTML.");
  if (sourceDirectory === root || sourceDirectory.startsWith(`${root}${path.sep}`)) {
    throw new Error("Source must be outside Project Monitor to avoid copying the repository into itself.");
  }

  const html = await readFile(sourceIndex, "utf8");
  const inferred = htmlMetadata(html);
  const title = args.title ?? inferred.title;
  const description = args.description ?? inferred.description;
  const slug = args.slug ?? slugify(title ?? path.basename(sourceDirectory));
  const status = args.status ?? "active";
  if (!title) throw new Error("A title is required. Add <title> or pass --title.");
  if (!description) throw new Error("A description is required. Add a meta description or pass --description.");
  if (!slug) throw new Error("Could not produce a valid slug.");
  if (!allowedStatuses.has(status)) throw new Error(`Invalid status: ${status}`);

  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const existingIndex = registry.findIndex((project) => project.slug === slug);
  if (existingIndex >= 0 && !args.slug) {
    throw new Error(`Project "${slug}" already exists. Pass --slug ${slug} to confirm an update.`);
  }

  const target = path.join(projectsPath, slug);
  const staging = path.join(projectsPath, `.staging-${slug}`);
  await mkdir(projectsPath, { recursive: true });
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });

  if (sourceStat.isDirectory()) {
    await cp(sourceDirectory, staging, { recursive: true, filter: (item) => !item.split(path.sep).includes(".git") });
  } else {
    await cp(source, path.join(staging, "index.html"));
  }

  await stat(path.join(staging, "index.html"));
  await rm(target, { recursive: true, force: true });
  await rename(staging, target);

  const now = new Date().toISOString();
  const existing = existingIndex >= 0 ? registry[existingIndex] : null;
  const project = {
    slug,
    title,
    description,
    status,
    pinned: args.pinned ?? existing?.pinned ?? false,
    publishedAt: existing?.publishedAt ?? now,
    updatedAt: now,
    path: `/projects/${slug}/`,
    ...(args["source-repository"] || existing?.sourceRepository
      ? { sourceRepository: args["source-repository"] ?? existing.sourceRepository }
      : {})
  };

  if (existingIndex >= 0) registry[existingIndex] = project;
  else registry.push(project);
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  const validation = await execFileAsync(process.execPath, [path.join(root, "scripts", "validate.mjs")], { cwd: root });
  console.log(`${existing ? "Updated" : "Published"}: ${project.title}`);
  console.log(`Local path: ${project.path}`);
  console.log(validation.stdout.trim());
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
