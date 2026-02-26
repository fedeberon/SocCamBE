const sql = require("mssql");

const dbConfig = {
  server: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

module.exports = async function (context, message) {
  const payload = message || {};
  const socioId = Number(payload.socioId || 0);
  const cuit = String(payload.cuit || "").replace(/\D/g, "");

  context.log("[SosSyncTrigger] Incoming message", { socioId, cuit, payload });

  if (!socioId || cuit.length !== 11) {
    context.log.warn("[SosSyncTrigger] Invalid payload, skipping", payload);
    return;
  }

  let pool;
  try {
    pool = await sql.connect(dbConfig);

    // TODO: acá va la llamada real a SOS + normalización + upsert en dbo.sos_movimientos
    // Por ahora dejamos un heartbeat de sync_status para validar plumbing end-to-end.
    await pool
      .request()
      .input("socio_id", sql.Int, socioId)
      .input("cuit", sql.VarChar(20), cuit)
      .query(`
        IF OBJECT_ID('dbo.sos_sync_status', 'U') IS NULL
        BEGIN
          CREATE TABLE dbo.sos_sync_status (
            socio_id INT NOT NULL,
            cuit_cuil VARCHAR(20) NOT NULL,
            status VARCHAR(30) NOT NULL,
            last_sync_at DATETIME2 NULL,
            last_error NVARCHAR(1000) NULL,
            updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
            CONSTRAINT PK_sos_sync_status PRIMARY KEY (socio_id, cuit_cuil)
          );
        END;

        MERGE dbo.sos_sync_status AS target
        USING (SELECT @socio_id AS socio_id, @cuit AS cuit_cuil) AS source
        ON target.socio_id = source.socio_id AND target.cuit_cuil = source.cuit_cuil
        WHEN MATCHED THEN
          UPDATE SET status = 'completed', last_sync_at = SYSDATETIME(), last_error = NULL, updated_at = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (socio_id, cuit_cuil, status, last_sync_at, updated_at)
          VALUES (source.socio_id, source.cuit_cuil, 'completed', SYSDATETIME(), SYSDATETIME());
      `);

    context.log("[SosSyncTrigger] Sync marker updated", { socioId, cuit });
  } catch (error) {
    context.log.error("[SosSyncTrigger] Failed", error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
};
