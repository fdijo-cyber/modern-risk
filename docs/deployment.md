# Deployment and operations

No live deployment has been made. This edition is a long-lived Node process using local SQLite and a periodic persisted-deadline scan. Hosting needs Node 24 and durable writable disk; one server process owns writes.

## Docker

```sh
docker build -t modern-risk .
docker run --rm -p 3000:3000 -v modern-risk-data:/app/data modern-risk
```

Open http://localhost:3000. TLS termination, allowed origins/proxy behavior, identity, session expiry, operational audit logs and stricter abuse controls must be reviewed before Internet release. The current API checks Origin against Host when present and never enables CORS.

The health route is GET `/health`. No credentials are required for liveness. Real readiness for a production adapter needs database/job health. The Docker image build is supplied but not run in this delivery.

## Backup and restore

For this single-process edition, stop the server and copy the entire `data/` directory to protected storage. Restore that directory while stopped and restart using the same DB_PATH. Do not copy only the main `.sqlite` file while writes/WAL are active. Backups contain confidential orders and token hashes: treat them as private.

Expired room timers resolve after restart using confirmed queues. To avoid unexpected deadline advancement during manual disaster-recovery work, restore in an isolated environment and review the snapshot before starting a production server. In-game pause/restore tooling is not yet implemented.

## PostgreSQL migration

`database/migrations/001_postgres.sql` is a server-private target schema with RLS enabled and no client grants. It is not a working adapter. Implement a transactional repository with row locks, unique resolution keys, least-privilege backend access, durable scheduler and recovery before switching hosting to distributed/serverless execution. Never connect the browser directly to full game snapshots.

## GitHub and your domain

Pushes to GitHub provide source/version history. **GitHub Pages is static-only and cannot run this multiplayer Node/SQLite server.** Use the included Dockerfile on a persistent Node/container host and connect that host to this GitHub repository for deployment. Configure durable disk at `/app/data`, set HOST=0.0.0.0 and the provider PORT, then point the domain at that host using the provider’s DNS instructions. No provider or domain has been chosen/configured by the source upload.
