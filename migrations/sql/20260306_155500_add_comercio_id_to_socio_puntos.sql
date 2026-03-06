/* Agrega FK real comercio_id en socio_puntos + backfill desde qr_payload */

IF COL_LENGTH('dbo.socio_puntos', 'comercio_id') IS NULL
BEGIN
  ALTER TABLE dbo.socio_puntos
    ADD comercio_id INT NULL;
END
GO

/* Backfill desde qr_payload: SCMPTS|v1|{comercioId}|... */
UPDATE sp
SET sp.comercio_id = TRY_CONVERT(
  INT,
  SUBSTRING(
    sp.qr_payload,
    LEN('SCMPTS|v1|') + 1,
    CHARINDEX('|', sp.qr_payload + '|', LEN('SCMPTS|v1|') + 1) - (LEN('SCMPTS|v1|') + 1)
  )
)
FROM dbo.socio_puntos sp
WHERE sp.comercio_id IS NULL
  AND sp.qr_payload IS NOT NULL
  AND sp.qr_payload LIKE 'SCMPTS|v1|%';
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_socio_puntos_comercio_id'
    AND object_id = OBJECT_ID('dbo.socio_puntos')
)
BEGIN
  CREATE INDEX IX_socio_puntos_comercio_id ON dbo.socio_puntos(comercio_id);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE name = 'FK_socio_puntos_comercio_puntos'
)
BEGIN
  ALTER TABLE dbo.socio_puntos WITH NOCHECK
    ADD CONSTRAINT FK_socio_puntos_comercio_puntos
      FOREIGN KEY (comercio_id) REFERENCES dbo.comercio_puntos(comercio_id);
END
GO
