/*
Healthcheck rápido de datos de cofres/cajas
Solo lectura
*/

SELECT 'dbo.MovimientoCuentaCorrienteCofre' AS tabla, COUNT(*) AS total
FROM dbo.MovimientoCuentaCorrienteCofre
UNION ALL
SELECT 'dbo.pagosCofres', COUNT(*)
FROM dbo.pagosCofres
UNION ALL
SELECT 'dbo.ProductoCofre', COUNT(*)
FROM dbo.ProductoCofre
UNION ALL
SELECT 'dbo.contratoCofres', COUNT(*)
FROM dbo.contratoCofres;

SELECT COUNT(DISTINCT MovimientoCuentaCorrienteCofre_clienteId) AS socios_con_movimientos
FROM dbo.MovimientoCuentaCorrienteCofre
WHERE ISNULL(MovimientoCuentaCorrienteCofre_deleted, 0) = 0;
