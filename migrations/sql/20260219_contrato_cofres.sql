IF OBJECT_ID('dbo.contratoCofres', 'U') IS NULL
  THROW 50000, 'La tabla dbo.contratoCofres no existe. Se esperaba reutilizar tabla legacy.', 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'contratoCofres_cajaId' AND object_id = OBJECT_ID('dbo.contratoCofres'))
ALTER TABLE dbo.contratoCofres ADD contratoCofres_cajaId INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'contratoCofres_dni' AND object_id = OBJECT_ID('dbo.contratoCofres'))
ALTER TABLE dbo.contratoCofres ADD contratoCofres_dni NVARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'contratoCofres_domicilioFiscal' AND object_id = OBJECT_ID('dbo.contratoCofres'))
ALTER TABLE dbo.contratoCofres ADD contratoCofres_domicilioFiscal NVARCHAR(300) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'contratoCofres_cajaNumero' AND object_id = OBJECT_ID('dbo.contratoCofres'))
ALTER TABLE dbo.contratoCofres ADD contratoCofres_cajaNumero NVARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'contratoCofres_firmaDigital' AND object_id = OBJECT_ID('dbo.contratoCofres'))
ALTER TABLE dbo.contratoCofres ADD contratoCofres_firmaDigital NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'contratoCofres_firmante' AND object_id = OBJECT_ID('dbo.contratoCofres'))
ALTER TABLE dbo.contratoCofres ADD contratoCofres_firmante NVARCHAR(200) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'contratoCofres_fechaFirma' AND object_id = OBJECT_ID('dbo.contratoCofres'))
ALTER TABLE dbo.contratoCofres ADD contratoCofres_fechaFirma DATETIME2 NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_contratoCofres_caja_seguridad')
ALTER TABLE dbo.contratoCofres WITH NOCHECK
ADD CONSTRAINT FK_contratoCofres_caja_seguridad
FOREIGN KEY (contratoCofres_cajaId) REFERENCES dbo.caja_seguridad(caja_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_contratoCofres_esSocioId' AND object_id = OBJECT_ID('dbo.contratoCofres'))
CREATE INDEX IX_contratoCofres_esSocioId ON dbo.contratoCofres(contratoCofres_esSocioId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_contratoCofres_cajaId' AND object_id = OBJECT_ID('dbo.contratoCofres'))
CREATE INDEX IX_contratoCofres_cajaId ON dbo.contratoCofres(contratoCofres_cajaId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_contratoCofres_estado' AND object_id = OBJECT_ID('dbo.contratoCofres'))
CREATE INDEX IX_contratoCofres_estado ON dbo.contratoCofres(contratoCofres_estado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_contratoCofres_modificado' AND object_id = OBJECT_ID('dbo.contratoCofres'))
CREATE INDEX IX_contratoCofres_modificado ON dbo.contratoCofres(contratoCofres_modificado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_contratoCofres_activo_socio_caja' AND object_id = OBJECT_ID('dbo.contratoCofres'))
CREATE UNIQUE INDEX UQ_contratoCofres_activo_socio_caja
ON dbo.contratoCofres(contratoCofres_esSocioId, contratoCofres_cajaId)
WHERE contratoCofres_fechaVencimiento IS NULL
  AND contratoCofres_estado <> 'Anulado'
  AND contratoCofres_cajaId IS NOT NULL;
GO
