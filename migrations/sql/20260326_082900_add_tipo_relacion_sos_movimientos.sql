IF OBJECT_ID('dbo.sos_movimientos', 'U') IS NULL
  THROW 50000, 'La tabla dbo.sos_movimientos no existe.', 1;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE name = 'tipo_movimiento'
    AND object_id = OBJECT_ID('dbo.sos_movimientos')
)
ALTER TABLE dbo.sos_movimientos ADD tipo_movimiento NVARCHAR(30) NULL;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE name = 'comprobante_numero'
    AND object_id = OBJECT_ID('dbo.sos_movimientos')
)
ALTER TABLE dbo.sos_movimientos ADD comprobante_numero NVARCHAR(100) NULL;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE name = 'factura_referencia'
    AND object_id = OBJECT_ID('dbo.sos_movimientos')
)
ALTER TABLE dbo.sos_movimientos ADD factura_referencia NVARCHAR(100) NULL;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_sos_movimientos_tipo_factura_ref'
    AND object_id = OBJECT_ID('dbo.sos_movimientos')
)
CREATE INDEX IX_sos_movimientos_tipo_factura_ref
  ON dbo.sos_movimientos (socio_id, tipo_movimiento, factura_referencia, fecha DESC);
GO
