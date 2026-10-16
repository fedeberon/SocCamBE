-- Gestion de eventos: columnas adicionales para dbo.acontecimientos
IF COL_LENGTH('dbo.acontecimientos', 'fecha_fin') IS NULL
BEGIN
  ALTER TABLE dbo.acontecimientos ADD fecha_fin DATETIME NULL;
END
GO
IF COL_LENGTH('dbo.acontecimientos', 'estado') IS NULL
BEGIN
  ALTER TABLE dbo.acontecimientos ADD estado NVARCHAR(20) NOT NULL CONSTRAINT df_acontecimientos_estado DEFAULT 'borrador';
END
GO
IF COL_LENGTH('dbo.acontecimientos', 'cupo') IS NULL
BEGIN
  ALTER TABLE dbo.acontecimientos ADD cupo INT NULL;
END
GO
IF COL_LENGTH('dbo.acontecimientos', 'imagen_url') IS NULL
BEGIN
  ALTER TABLE dbo.acontecimientos ADD imagen_url NVARCHAR(500) NULL;
END
GO
IF COL_LENGTH('dbo.acontecimientos', 'creado_en') IS NULL
BEGIN
  ALTER TABLE dbo.acontecimientos ADD creado_en DATETIME2 NULL CONSTRAINT df_acontecimientos_creado_en DEFAULT SYSUTCDATETIME();
END
GO
ALTER TABLE dbo.acontecimientos ALTER COLUMN descripcion NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'IX_acontecimientos_estado' AND object_id = OBJECT_ID('dbo.acontecimientos')
)
BEGIN
  CREATE INDEX IX_acontecimientos_estado ON dbo.acontecimientos (estado);
END
GO
