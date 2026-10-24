# GitHub source workflow

Repository: **https://github.com/fdijo-cyber/modern-risk**.

The user explicitly authorized this repository to remain public and requested source publication after the geographic-map update. This supersedes the private-repository requirement in the preserved original specification. Production sessions, tokens, API credentials and uploaded reference images are excluded from source.

The first validated source baseline is imported onto `main`. Subsequent major changes should use feature branches and pull requests. The repository contains CI for tests, JavaScript validation and the future PostgreSQL schema. Check the actual GitHub Actions results before claiming remote checks pass.

The full game uses a Node 24 server and persistent SQLite storage. GitHub stores the source; it does not host live multiplayer by itself. GitHub Pages cannot run this server. Connect the repository to a Node/Docker hosting provider with durable disk, deploy the server, then attach the custom domain there. See deployment.md. No hosting provider, billing plan, domain, or production deployment has been configured by this source upload.

## Ongoing engineering rules

1. Preserve `main` and existing source/history.
2. Create feature branches and PRs for major improvements; run tests and required CI.
3. Never commit `data/`, `.env`, user sessions, tokens, or actual API secrets.
4. Configure branch protections/required checks where the account supports them.
5. Track known gaps in progress.md; no interface-only completion claims.
6. Validate a clean source restore using Node 24 and a two-client gameplay test when server behavior changes.
