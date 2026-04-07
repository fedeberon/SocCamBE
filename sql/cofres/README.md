# Consultas Cofres/Cajas (solo lectura)

Objetivo: consumir datos existentes de cajas/cofres por socio **sin modificar nada**.

## Tablas base detectadas

- `dbo.MovimientoCuentaCorrienteCofre` (movimientos por cliente/socio)
- `dbo.pagosCofres` (pagos vinculados a contrato)
- `dbo.ProductoCofre` (actualmente sin registros)
- `dbo.contratoCofres` (actualmente sin registros)

## Uso recomendado

Ejecutar primero:
1. `00_healthcheck_cofres.sql`
2. `01_base_movimientos_por_socio.sql`
3. `02_resumen_saldo_por_socio.sql`
4. `03_ultimos_movimientos_por_socio.sql`
5. `04_busqueda_socio_cofre.sql` (ajustar parámetros)

## Importante

- Todas las consultas son `SELECT`.
- No hay `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, ni `ALTER`.
- Si más adelante quieren API, estas consultas ya sirven como base para endpoints read-only.
