-- Permite cargar mas de un rubro por socio (Opcion B).
-- socio_rubro  (INT, existente) = rubro principal
-- socio_rubros (NVARCHAR, nueva) = rubros adicionales separados por coma, ej. "2,3"
-- No modifica datos existentes; la columna nace NULL.
IF COL_LENGTH('dbo.socio', 'socio_rubros') IS NULL
BEGIN
    ALTER TABLE dbo.socio ADD socio_rubros NVARCHAR(50) NULL;
END;

-- Opcional: inicializar los adicionales con el rubro actual de cada socio (descomentar si se desea)
-- UPDATE dbo.socio
-- SET socio_rubros = CASE
--     WHEN socio_rubro IS NOT NULL THEN CAST(socio_rubro AS NVARCHAR(10))
--     ELSE NULL
-- END;