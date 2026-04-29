#!/usr/bin/env node

require('dotenv').config();

const sequelize = require('../src/configs/database').default;
const Socio = require('../src/models/socio.models').default;
const SosMovimiento = require('../src/models/sosMovimiento.models').default;
const sosContadorService = require('../src/service/sosContador.service').default;
const sosMovimientosService = require('../src/service/sosMovimientos.service').default;

function argValue(name, fallback = undefined) {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function sanitizeCuit(value) {
  return String(value || '').replace(/\D/g, '');
}

async function main() {
  const socioIdRaw = process.argv[2];
  const socioId = Number(socioIdRaw);

  if (!socioIdRaw || Number.isNaN(socioId) || socioId <= 0) {
    console.error('Uso: node -r ts-node/register scripts/sos-hard-refresh.js <socioId> [--desde YYYY-MM-DD] [--hasta YYYY-MM-DD] [--periodo mes]');
    process.exit(1);
  }

  const fechaDesde = argValue('--desde', process.env.SOS_SYNC_DEFAULT_FROM || '2024-01-01');
  const fechaHasta = argValue('--hasta', undefined);
  const periodo = argValue('--periodo', 'mes');

  await sequelize.authenticate();

  const socio = await Socio.findByPk(socioId);
  if (!socio) {
    throw new Error(`Socio no encontrado: ${socioId}`);
  }

  const socioData = typeof socio.get === 'function' ? socio.get({ plain: true }) : socio;
  const cuit = sanitizeCuit(socioData.socio_cuit);
  if (!cuit) {
    throw new Error(`El socio ${socioId} no tiene CUIT/CUIL configurado`);
  }

  const hardDeletedCount = await SosMovimiento.destroy({
    where: {
      socio_id: socioId,
      cuit_cuil: cuit,
    },
    force: true,
  });

  console.log(`[hard-refresh] socioId=${socioId} cuit=${cuit} movimientos previos eliminados físicamente: ${hardDeletedCount}`);

  const movimientosCc = await sosContadorService.getMovimientosCuentaCorrienteBySocioCuit({
    socioCuit: cuit,
    fechaDesde,
    fechaHasta,
  });

  await sosMovimientosService.upsertFromCuentaCorriente(socioId, cuit, movimientosCc, periodo);
  console.log(`[hard-refresh] cuenta corriente sincronizada: ${movimientosCc.length} movimientos`);

  const cobros = await sosContadorService.getCobrosBySocioCuit({
    socioCuit: cuit,
    periodo,
  });

  const pagosSos = cobros.map((sos_cobro) => ({ sos_cobro }));
  await sosMovimientosService.upsertFromPagosSos(socioId, pagosSos, periodo);
  console.log(`[hard-refresh] cobros sincronizados: ${cobros.length} cobros`);

  const activos = await SosMovimiento.count({
    where: { socio_id: socioId, cuit_cuil: cuit, deleted: false },
  });

  console.log(`[hard-refresh] OK socioId=${socioId} activos=${activos}`);
}

main()
  .catch((err) => {
    console.error('[hard-refresh] ERROR:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await sequelize.close();
    } catch (_) {}
  });
