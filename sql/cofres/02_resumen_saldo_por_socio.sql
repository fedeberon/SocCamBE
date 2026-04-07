/*
Resumen por socio (cliente) de movimientos de cofres
Solo lectura
*/

SELECT
  m.MovimientoCuentaCorrienteCofre_clienteId AS socio_id,
  COUNT(*) AS cantidad_movimientos,
  SUM(ISNULL(m.MovimientoCuentaCorrienteCofre_importe, 0)) AS total_importe,
  SUM(ISNULL(m.MovimientoCuentaCorrienteCofre_importeCobrar, 0)) AS total_importe_cobrar,
  MAX(m.MovimientoCuentaCorrienteCofre_fechaIngreso) AS ultima_fecha_movimiento
FROM dbo.MovimientoCuentaCorrienteCofre m
WHERE ISNULL(m.MovimientoCuentaCorrienteCofre_deleted, 0) = 0
GROUP BY m.MovimientoCuentaCorrienteCofre_clienteId
ORDER BY ultima_fecha_movimiento DESC;
