import { IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class CreateContratoCofreDto {
  @IsInt({ message: 'socioId debe ser numérico' })
  socioId!: number;

  @IsInt({ message: 'cajaId debe ser numérico' })
  cajaId!: number;

  @IsOptional()
  @IsString({ message: 'socioNombre debe ser string' })
  socioNombre?: string;

  @IsOptional()
  @IsString({ message: 'socioDni debe ser string' })
  socioDni?: string;

  @IsOptional()
  @IsString({ message: 'domicilioFiscal debe ser string' })
  domicilioFiscal?: string;

  @IsOptional()
  @IsString({ message: 'cajaNumero debe ser string o número serializado' })
  cajaNumero?: string;

  @IsOptional()
  @IsString({ message: 'fechaInicio debe ser string YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaInicio debe tener formato YYYY-MM-DD' })
  fechaInicio?: string;
}
