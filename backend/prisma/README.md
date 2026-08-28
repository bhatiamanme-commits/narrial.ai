# YouTube persistence development runbook

This directory owns only the Narrial YouTube Connection persistence schema. Use PostgreSQL 18.x with the exact Prisma and PostgreSQL packages pinned in `package.json`. Keep `DATABASE_URL` in ignored local configuration or an approved environment secret store; never commit it.

## Development workflow

```powershell
npm.cmd run db:validate
npm.cmd run db:migrate:dev -- --name <approved_change_name>
npm.cmd run db:generate
npm.cmd run db:migrate:status
```

`prisma migrate dev` is development-only. Never point it at staging or production. If it proposes a reset, stop and obtain explicit approval for the exact disposable development database.

## Clean creation verification

For an explicitly approved disposable local database, `prisma migrate reset --force` drops and recreates the PostgreSQL schema, reapplies migration history, and destroys its data. Follow it with `db:migrate:status` and the database-focused tests. Never use reset against staging, production, shared development data, or real provider/user data.

## Rollback and forward recovery

- Before a migration is applied: correct the reviewed migration and schema, then repeat clean creation verification.
- After a migration is shared or contains data: do not edit or delete it. Restore behavior with a new forward migration that reverses the schema change while preserving required data.
- After a failed development migration: diagnose the failure; reset only an approved disposable database and replay the unchanged migration history.
- For a failed non-disposable migration: preserve the database and migration ledger, stop writes when required, use `prisma migrate status` plus an approved `prisma migrate resolve`/forward-fix procedure, and restore from a verified backup only under the owning environment runbook.

Current B04 verification is local development only. Staging and production database creation, migration, rollback, and recovery remain unauthorized.

Official references:

- https://www.prisma.io/docs/cli/migrate/dev
- https://www.prisma.io/docs/cli/v7/migrate/reset
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting
