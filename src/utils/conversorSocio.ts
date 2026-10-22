function convertirDatosSocio(body: any) {
  return {
    socio_nombre: body.socio_nombre,
    socio_apellido: body.socio_apellido,
    socio_nacionalidad: body.socio_nacionalidad,
    socio_dni: body.socio_dni,
    socio_fechaNacimiento: parseDateOnly(body.socio_fechaNacimiento),
    socio_cuit: body.socio_cuit,
    socio_mail: body.socio_mail,
    socio_firma: body.socio_firma,
    socio_tipoEmpresa: body.socio_tipoEmpresa,
    socio_domicilio: body.socio_domicilio,
    socio_telefono: body.socio_telefono,
    socio_tipoSocio: parseBigInt(body.socio_tipoSocio),
    socio_numero: parseIntSafe(body.socio_numero),
    socio_fechaAprobacion: parseDateOnly(body.socio_fechaAprobacion),
    socio_acta: parseIntSafe(body.socio_acta),
    socio_padrino1: parseBigInt(body.socio_padrino1),
    socio_padrino2: parseBigInt(body.socio_padrino2),
    socio_sector: parseIntSafe(body.socio_sector),
    socio_deleted: parseBool(body.socio_deleted),
    socio_tieneCajaSeguridad: parseBool(body.socio_tieneCajaSeguridad),
    socio_estado: parseIntSafe(body.socio_estado),
    socio_modificado: body.socio_modificado ? new Date(body.socio_modificado) : null,
    socio_motivoBaja: body.socio_motivoBaja,
    socio_gestion: parseBigInt(body.socio_gestion),
    socio_segmento: parseBigInt(body.socio_segmento),
    socio_habilitacion: body.socio_habilitacion,
    socio_rubro: parseIntSafe(body.socio_rubro),
    socio_rubros: body.socio_rubros ? String(body.socio_rubros) : null,
    socio_localidad: parseIntSafe(body.socio_localidad),
    socio_localidad_nombre: body.socio_localidad_nombre,
    socio_condicionFiscal: parseIntSafe(body.socio_condicionFiscal),
    socio_celular: body.socio_celular,
    socio_otroTelefono: body.socio_otroTelefono,
    socio_tarjetaEntregada: parseBool(body.socio_tarjetaEntregada),
    socio_tarjetaFechaEntrega: parseBigInt(body.socio_tarjetaFechaEntrega),
    socio_Campanias: parseIntSafe(body.socio_Campanias),
    socio_enviarMail: parseBool(body.socio_enviarMail),
  };
}

function convertirTiposSocio(body: any): any {
  const camposBigInt = [
    "socio_tipoSocio",
    "socio_padrino1",
    "socio_padrino2",
    "socio_gestion",
    "socio_segmento",
  ];

  for (const campo of camposBigInt) {
    if (body[campo] !== undefined && body[campo] !== null && body[campo] !== "") {
      body[campo] = Number(body[campo]);
    } else {
      body[campo] = null;
    }
  }

  return body;
}

// Funciones auxiliares
function parseIntSafe(value: any): number | null {
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

function parseBigInt(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function parseDateOnly(value: any): string | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const raw = String(value).trim();
  return raw.length >= 10 ? raw.slice(0, 10) : raw;
}



function parseBool(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return Boolean(value);
}
export default convertirDatosSocio;