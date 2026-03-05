IF OBJECT_ID('dbo.comercio_puntos', 'U') IS NOT NULL
BEGIN
  IF COL_LENGTH('dbo.comercio_puntos', 'logo_url') IS NULL
  BEGIN
    ALTER TABLE dbo.comercio_puntos
    ADD logo_url VARCHAR(500) NULL;
  END
END
