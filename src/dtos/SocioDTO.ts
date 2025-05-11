// dtos/SocioDTO.ts

import TipoSocio from "../models/tipoSocio.models";

export interface SocioDTO {
    id: number;
    nombre: string;
    nacionalidad: string;
    dni: string;
    fechaNacimiento: Date;
    cuit: string;
    email: string;
    firma: string;
    tipoEmpresa: string;
    domicilio: string;
    telefono: string;
    tipoSocio: TipoSocio | null;
    numero: number;
    sector: string;
    estado: string;
    motivoBaja: string;
    gestion: string;
    segmento: string;
    habilitacion: string;
    rubro: string;
    localidad: string;
    condicionFiscal: string;
    celular: string;
    otroTelefono: string;
    campanias: string;
    enviarMail: boolean;
  }
  