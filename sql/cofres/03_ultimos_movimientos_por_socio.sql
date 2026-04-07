/*
Últimos N movimientos por socio
Solo lectura

Ajustar @TopN según necesidad
*/

DECLARE @TopN INT = 5;

WITH Movs AS (
  SELECT
    m.*,
    ROW_NUMBER() OVER (
      PARTITION BY m.MovimientoCuentaCorrienteCofre_clienteId
      ORDER BY m.MovimientoCuentaCorrienteCofre_fechaIngreso DESC, m.MovimientoCuentaCorrienteCofre_id DESC
    ) AS rn
  FROM dbo.MovimientoCuentaCorrienteCofre m
  WHERE ISNULL(m.MovimientoCuentaCorrienteCofre_deleted, 0) = 0
)
SELECT
  MovimientoCuentaCorrienteCofre_clienteId AS socio_id,
  MovimientoCuentaCorrienteCofre_id AS movimiento_id,
  MovimientoCuentaCorrienteCofre_fechaIngreso AS fecha,
  MovimientoCuentaCorrienteCofre_tipoMovimiento AS tipo_movimiento,
  MovimientoCuentaCorrienteCofre_importe AS importe,
  MovimientoCuentaCorrienteCofre_importeCobrar AS importe_cobrar,
  MovimientoCuentaCorrienteCofre_procesado AS procesado
FROM Movs
WHERE rn <= @TopN
ORDER BY socio_id, fecha DESC;
