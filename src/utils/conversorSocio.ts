function convertirDatosSocio(body: any) {
  return {
    socio_nombre: body.socio_nombre,
    socio_apellido: body.socio_apellido,
    socio_nacionalidad: body.socio_nacionalidad,
    socio_dni: body.socio_dni,
    socio_fechaNacimiento: body.socio_fechaNacimiento ? new Date(body.socio_fechaNacimiento) : null,
    socio_cuit: body.socio_cuit,
    socio_mail: body.socio_mail,
    socio_firma: body.socio_firma,
    socio_tipoEmpresa: body.socio_tipoEmpresa,
    socio_domicilio: body.socio_domicilio,
    socio_telefono: body.socio_telefono,
    socio_tipoSocio: parseBigInt(body.socio_tipoSocio),
    socio_numero: parseIntSafe(body.socio_numero),
    socio_fechaAprobacion: body.socio_fechaAprobacion ? new Date(body.socio_fechaAprobacion) : null,
    socio_acta: parseIntSafe(body.socio_acta),
    socio_padrino1: parseBigInt(body.socio_padrino1),
    socio_padrino2: parseBigInt(body.socio_padrino2),
    socio_sector: parseIntSafe(body.socio_sector),
    socio_deleted: parseBool(body.socio_deleted),
    socio_tieneCajaSeguridad: parseBool(body.socio_tieneCajaSeguridad),
    socio_estado: parseIntSafe(body.socio_estado),
    socio_modificado: new Date(), // o `new Date(body.socio_modificado)` si viene del cliente
    socio_motivoBaja: body.socio_motivoBaja,
    socio_gestion: parseBigInt(body.socio_gestion),
    socio_segmento: parseBigInt(body.socio_segmento),
    socio_habilitacion: body.socio_habilitacion,
    socio_rubro: parseIntSafe(body.socio_rubro),
    socio_localidad: parseIntSafe(body.socio_localidad),
    socio_condicionFiscal: parseIntSafe(body.socio_condicionFiscal),
    socio_celular: body.socio_celular,
    socio_otroTelefono: body.socio_otroTelefono,
    socio_tarjetaEntregada: parseBool(body.socio_tarjetaEntregada),
    socio_tarjetaFechaEntrega: body.socio_tarjetaFechaEntrega ? new Date(body.socio_tarjetaFechaEntrega) : null,
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



function parseBool(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return Boolean(value);
}
export default convertirDatosSocio;