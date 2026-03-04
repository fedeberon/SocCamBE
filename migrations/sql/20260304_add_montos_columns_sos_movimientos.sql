IF OBJECT_ID('dbo.sos_movimientos', 'U') IS NULL
  THROW 50000, 'La tabla dbo.sos_movimientos no existe.', 1;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE name = 'montodebe'
    AND object_id = OBJECT_ID('dbo.sos_movimientos')
)
ALTER TABLE dbo.sos_movimientos ADD montodebe DECIMAL(18,2) NULL;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE name = 'montohaber'
    AND object_id = OBJECT_ID('dbo.sos_movimientos')
)
ALTER TABLE dbo.sos_movimientos ADD montohaber DECIMAL(18,2) NULL;
GO
