// mappers/SocioMapper.ts

import { SocioDTO } from '../dtos/SocioDTO';
import Socio from '../models/socio.models';
import tipoSocioService from '../service/tipoSocio.service';

export const toSocioDTO = async (socio: Socio): Promise<SocioDTO> => ({
  id: socio.getDataValue('socio_id'),
  nombre: socio.getDataValue('socio_nombre'),
  nacionalidad: socio.getDataValue('socio_nacionalidad'),
  dni: socio.getDataValue('socio_dni'),
  fechaNacimiento: socio.getDataValue('socio_fechaNacimiento'),
  cuit: socio.getDataValue('socio_cuit'),
  email: socio.getDataValue('socio_mail'),
  firma: socio.getDataValue('socio_firma'),
  tipoEmpresa: socio.getDataValue('socio_tipoEmpresa'),
  domicilio: socio.getDataValue('socio_domicilio'),
  telefono: socio.getDataValue('socio_telefono'),
  tipoSocio: await tipoSocioService.getTipoSocioById(parseInt(socio.getDataValue('socio_tipoSocio'))),
  numero: socio.getDataValue('socio_numero'),
  sector: socio.getDataValue('socio_sector'),
  estado: socio.getDataValue('socio_estado'),
  motivoBaja: socio.getDataValue('socio_motivoBaja'),
  gestion: socio.getDataValue('socio_gestion'),
  segmento: socio.getDataValue('socio_segmento'),
  habilitacion: socio.getDataValue('socio_habilitacion'),
  rubro: socio.getDataValue('socio_rubro'),
  localidad: socio.getDataValue('socio_localidad'),
  condicionFiscal: socio.getDataValue('socio_condicionFiscal'),
  celular: socio.getDataValue('socio_celular'),
  otroTelefono: socio.getDataValue('socio_otroTelefono'),
  campanias: socio.getDataValue('socio_Campanias'),
  enviarMail: socio.getDataValue('socio_enviarMail'),
});

export const toSocioDTOList = async (socios: Socio[]): Promise<SocioDTO[]> => {
  return Promise.all(socios.map(socio => toSocioDTO(socio)));
};



