#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

async function run() {
  const sequelize = require('../dist/configs/database').default;
  const migrationsDir = path.join(__dirname, '..', 'migrations', 'sql');

  if (!fs.existsSync(migrationsDir)) {
    console.log('[sql-migrate] no existe migrations/sql, nada para ejecutar');
    process.exit(0);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.log('[sql-migrate] no hay archivos .sql para ejecutar');
    process.exit(0);
  }

  await sequelize.authenticate();

  await sequelize.query(`
    IF OBJECT_ID('dbo.sql_migrations', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.sql_migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        filename NVARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      )
    END
  `);

  for (const file of files) {
    const [rows] = await sequelize.query(
      "SELECT TOP 1 filename FROM dbo.sql_migrations WHERE filename = :filename",
      { replacements: { filename: file } },
    );

    if (Array.isArray(rows) && rows.length > 0) {
      console.log(`[sql-migrate] skip ${file} (ya ejecutado)`);
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    const batches = sql
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter(Boolean);

    console.log(`[sql-migrate] apply ${file} (${batches.length} batch/es)`);

    for (const batch of batches) {
      await sequelize.query(batch);
    }

    await sequelize.query(
      'INSERT INTO dbo.sql_migrations (filename) VALUES (:filename)',
      { replacements: { filename: file } },
    );

    console.log(`[sql-migrate] done ${file}`);
  }

  await sequelize.close();
}

run().catch(async (err) => {
  console.error('[sql-migrate] error:', err?.message || err);
  try {
    const sequelize = require('../dist/configs/database').default;
    await sequelize.close();
  } catch (_) {
    // noop
  }
  process.exit(1);
});
