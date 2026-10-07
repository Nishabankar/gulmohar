# Gulmohar City React Project Rules

## Deployment & Packaging Rules
- **Do NOT include pre-built output (`dist/` directory) inside `gulmohar-deploy.zip`**.
- Always generate the deployment zip using `npm run package` (which uses `git archive --format=zip --output=gulmohar-deploy.zip HEAD`).
- `git archive` ensures clean source code packaging without built `dist/` artifacts or node_modules.
- Always ensure local commits are pushed to the GitHub origin (`https://github.com/Nishabankar/gulmohar.git`) prior to creating the zip archive.
- Hostinger is configured to handle the build on install/startup.
