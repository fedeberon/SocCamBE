/*
Base de movimientos de cofres por socio (cliente)
Solo lectura
*/

SELECT
  m.MovimientoCuentaCorrienteCofre_clienteId AS socio_id,
  m.MovimientoCuentaCorrienteCofre_id AS movimiento_id,
  m.MovimientoCuentaCorrienteCofre_fechaIngreso AS fecha,
  m.MovimientoCuentaCorrienteCofre_tipoMovimiento AS tipo_movimiento,
  m.MovimientoCuentaCorrienteCofre_comprobanteTipo AS comprobante_tipo,
  m.MovimientoCuentaCorrienteCofre_comprobanteRelacionado AS comprobante_relacionado,
  m.MovimientoCuentaCorrienteCofre_importe AS importe,
  m.MovimientoCuentaCorrienteCofre_importeCobrar AS importe_cobrar,
  m.MovimientoCuentaCorrienteCofre_procesado AS procesado
FROM dbo.MovimientoCuentaCorrienteCofre m
WHERE ISNULL(m.MovimientoCuentaCorrienteCofre_deleted, 0) = 0
ORDER BY m.MovimientoCuentaCorrienteCofre_clienteId, m.MovimientoCuentaCorrienteCofre_fechaIngreso DESC;
