# Project Monitor

A dependency-free static dashboard that collects standalone HTML sites created in any repository.

## Chosen workflow

1. Codex creates and verifies a standalone HTML site anywhere.
2. Codex asks whether to add it to Project Monitor.
3. After explicit approval, Codex publishes it here, validates it, commits, and pushes.
4. GitHub Actions validates the repository.
5. Vercel deploys the `main` branch.

The user does not manually operate the publishing script. It exists so every Codex session performs copying, registration, and updates consistently.

## Publishing internally

```sh
npm run publish -- \
  --source "/absolute/path/to/site" \
  --title "Camera Phone" \
  --description "Current product and implementation notes" \
  --status active
npm test
```

To intentionally update the same deployed project, pass its stable slug:

```sh
npm run publish -- --source "/absolute/path/to/site" --slug camera-phone
```

The publish operation validates the repository before it succeeds. The first publish infers title and description from the HTML when possible. Updating requires `--slug` so an accidental title collision cannot overwrite a project. Existing `publishedAt`, pin state, and source repository are preserved unless explicitly changed.

## Ordering

Cards are ordered automatically:

1. Pinned projects
2. Active projects
3. Complete projects
4. Archived projects
5. Most recently updated within each group

## Important source-site constraint

Published pages live below `/projects/<slug>/`. Their local links must be relative, such as `./assets/image.png`, not root-relative, such as `/assets/image.png`. Validation rejects root-relative references because they commonly break after copying.

## One-time setup

1. Create a Git repository and push it to GitHub.
2. Import the repository into Vercel as a static project with no build command.
3. Protect `main` and require the `Validate Project Monitor` check if preview-before-production is desired.
4. Add the global instruction below to the Codex `AGENTS.md` that applies across repositories.

```md
## Universal Project Monitor

Whenever you create or substantially update a standalone HTML site, ask whether I want to add it to Project Monitor.

Project Monitor repository: `/Users/ana/self work/project monitor`

Never publish without explicit approval. After approval, infer metadata where safe, use the repository publishing workflow, validate it, commit and push it, verify CI and deployment, and return the public URL. Ask only when required metadata cannot be inferred. Updating an existing project must use its stable slug and replace its current files.
```
