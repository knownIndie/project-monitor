# Project Monitor rules

- Treat `data/projects.json` as the dashboard registry.
- Keep one stable directory per project at `projects/<slug>/`.
- Publishing an existing slug replaces its deployed files. Git preserves history, so never create `-new`, `-v2`, or `-final` folders.
- Copy the complete standalone site when it has local assets.
- Run `npm test` and `npm run validate` after every publish or registry change.
- When the user asks to activate or deactivate a project, run `npm run status -- --slug <slug> --status <active|inactive>`, validate, commit, and push after approval.
- Never publish, commit, push, or deploy without the user's explicit approval.
- After approval, perform the mechanical publishing command on the user's behalf. The user should not need to run it.
