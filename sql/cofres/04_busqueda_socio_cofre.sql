/*
Búsqueda puntual por socio_id (cliente)
Solo lectura

Reemplazar @SocioId por el ID a consultar
*/

DECLARE @SocioId BIGINT = 0; -- <-- cambiar

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
  AND m.MovimientoCuentaCorrienteCofre_clienteId = @SocioId
ORDER BY m.MovimientoCuentaCorrienteCofre_fechaIngreso DESC;

SELECT
  p.pagosCofres_id,
  p.pagosCofres_contrato,
  p.pagosCofres_periodo,
  p.pagosCofres_anio,
  p.pagosCofres_importe,
  p.pagosCofres_fechaPago,
  p.pagosCofres_estado,
  p.pagosCofres_operacion
FROM dbo.pagosCofres p
WHERE ISNULL(p.pagosCofres_deleted, 0) = 0
ORDER BY p.pagosCofres_fechaPago DESC;
