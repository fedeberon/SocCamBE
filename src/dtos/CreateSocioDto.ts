import { IsString, IsNotEmpty, IsInt, IsEmail, IsDate, IsBoolean } from 'class-validator';

export class CreateSocioDto {

    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    socio_nombre!: string;

    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    socio_apellido!: string;

    @IsString({ message: 'La nacionalidad debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La nacionalidad es obligatoria' })
    socio_nacionalidad!: string;

    @IsString({ message: 'El DNI debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El DNI es obligatorio' })
    socio_dni!: string;

    @IsDate({ message: 'La fecha de nacimiento debe ser una fecha válida' })
    @IsNotEmpty( { message: 'La fecha de nacimiento es obligatoria' })
    socio_fechaNacimiento!: Date;

    @IsString({ message: 'El CUIT debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El CUIT es obligatorio' })
    socio_cuit!: string;

    @IsEmail({}, { message: 'Debe ser un correo válido' })
    @IsNotEmpty({ message: 'El correo es obligatorio' })
    socio_mail!: string;

    @IsString({ message: 'La firma debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La firma es obligatoria' })
    socio_firma!: string;

    @IsString({ message: 'El tipo de empresa debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El tipo de empresa es obligatorio' })
    socio_tipoEmpresa!: string;

    @IsString({ message: 'El domicilio debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El domicilio es obligatorio' })
    socio_domicilio!: string;

    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El teléfono es obligatorio' })
    socio_telefono!: string;

    @IsString({ message: 'El tipo de socio debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El tipo de socio es obligatorio' })
    socio_tipoSocio!: string;

    @IsInt({ message: 'El número de socio debe ser un número entero' })
    @IsNotEmpty({ message: 'El número de socio es obligatorio' })
    socio_numero!: number;

    @IsString({ message: 'El sector debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El sector es obligatorio' })
    socio_sector!: string;

    @IsBoolean({ message: 'La tarjeta entregada debe ser un valor booleano' })
    @IsNotEmpty({ message: 'El estado socio_tieneCajaSeguridad es obligatorio' })
    socio_tieneCajaSeguridad!: boolean;

    @IsString({ message: 'El estado debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El estado es obligatorio' })
    socio_estado!: string;

    @IsDate({ message: 'La fecha de aprobación debe ser una fecha válida' })
    @IsNotEmpty({ message: 'La fecha de aprobación es obligatoria' })
    socio_gestion!: string;

    @IsString({ message: 'El segmento debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El segmento es obligatorio' })
    socio_segmento!: string;

    @IsString({ message: 'La habilitación debe ser una cadena de texto' })
    socio_habilitacion!: string;

    @IsString({ message: 'El rubro debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El rubro es obligatorio' })
    socio_rubro!: string;

    @IsString({ message: 'La localidad debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La localidad es obligatoria' })
    socio_localidad!: string;

    @IsString({ message: 'La condición fiscal debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La condición fiscal es obligatoria' })
    socio_condicionFiscal!: string;

    @IsString({ message: 'El celular debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El celular es obligatorio' })
    socio_celular!: string;
}