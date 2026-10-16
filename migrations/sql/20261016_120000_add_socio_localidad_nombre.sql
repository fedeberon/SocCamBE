-- Localidad como texto libre (nombre de ciudad) manteniendo el codigo legado socio_localidad
IF COL_LENGTH('dbo.socio', 'socio_localidad_nombre') IS NULL
BEGIN
  ALTER TABLE dbo.socio ADD socio_localidad_nombre NVARCHAR(150) NULL;
END
GO
