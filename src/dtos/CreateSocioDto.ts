import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSocioDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  socio_nombre!: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  socio_apellido!: string;

  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  socio_dni!: string;

  @IsEmail({}, { message: 'Debe ser un correo válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  socio_mail!: string;

  @IsInt({ message: 'El tipo de socio debe ser un número entero' })
  socio_tipoSocio!: number;

  @IsInt({ message: 'La condición fiscal debe ser un número entero' })
  socio_condicionFiscal!: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida' })
  socio_fechaNacimiento?: string;

  @IsOptional()
  @IsString({ message: 'La nacionalidad debe ser una cadena de texto' })
  socio_nacionalidad?: string;

  @IsOptional()
  @IsString({ message: 'El CUIT debe ser una cadena de texto' })
  socio_cuit?: string;

  @IsOptional()
  @IsString({ message: 'La firma debe ser una cadena de texto' })
  socio_firma?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de empresa debe ser una cadena de texto' })
  socio_tipoEmpresa?: string;

  @IsOptional()
  @IsString({ message: 'El domicilio debe ser una cadena de texto' })
  socio_domicilio?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  socio_telefono?: string;

  @IsOptional()
  @IsInt({ message: 'El número de socio debe ser un número entero' })
  socio_numero?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de aprobación debe ser una fecha válida' })
  socio_fechaAprobacion?: string;

  @IsOptional()
  @IsInt({ message: 'El acta debe ser un número entero' })
  socio_acta?: number;

  @IsOptional()
  @IsInt({ message: 'El padrino 1 debe ser un número entero' })
  socio_padrino1?: number;

  @IsOptional()
  @IsInt({ message: 'El padrino 2 debe ser un número entero' })
  socio_padrino2?: number;

  @IsOptional()
  @IsInt({ message: 'El sector debe ser un número entero' })
  socio_sector?: number;

  @IsOptional()
  @IsBoolean({ message: 'socio_deleted debe ser booleano' })
  socio_deleted?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'socio_tieneCajaSeguridad debe ser booleano' })
  socio_tieneCajaSeguridad?: boolean;

  @IsOptional()
  @IsInt({ message: 'El estado debe ser un número entero' })
  socio_estado?: number;

  @IsOptional()
  @IsDateString({}, { message: 'socio_modificado debe ser una fecha válida' })
  socio_modificado?: string;

  @IsOptional()
  @IsString({ message: 'El motivo de baja debe ser una cadena de texto' })
  socio_motivoBaja?: string;

  @IsOptional()
  @IsInt({ message: 'La gestión debe ser un número entero' })
  socio_gestion?: number;

  @IsOptional()
  @IsInt({ message: 'El segmento debe ser un número entero' })
  socio_segmento?: number;

  @IsOptional()
  @IsString({ message: 'La habilitación debe ser una cadena de texto' })
  socio_habilitacion?: string;

  @IsOptional()
  @IsInt({ message: 'El rubro debe ser un número entero' })
  socio_rubro?: number;

  @IsOptional()
  @IsString({ message: 'Los rubros adicionales deben ser una cadena de texto' })
  socio_rubros?: string;

  @IsOptional()
  @IsInt({ message: 'La localidad debe ser un número entero' })
  socio_localidad?: number;

  @IsOptional()
  @IsString({ message: 'El nombre de la localidad debe ser una cadena de texto' })
  socio_localidad_nombre?: string;

  @IsOptional()
  @IsString({ message: 'El celular debe ser una cadena de texto' })
  socio_celular?: string;

  @IsOptional()
  @IsString({ message: 'El otro teléfono debe ser una cadena de texto' })
  socio_otroTelefono?: string;

  @IsOptional()
  @IsBoolean({ message: 'socio_tarjetaEntregada debe ser booleano' })
  socio_tarjetaEntregada?: boolean;

  @IsOptional()
  @IsInt({ message: 'La fecha de entrega de tarjeta debe ser un número entero' })
  socio_tarjetaFechaEntrega?: number;

  @IsOptional()
  @IsInt({ message: 'Las campañas deben ser un número entero' })
  socio_Campanias?: number;

  @IsOptional()
  @IsBoolean({ message: 'socio_enviarMail debe ser booleano' })
  socio_enviarMail?: boolean;
}
