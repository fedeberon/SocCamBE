import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class FirmarContratoCofreDto {
  @IsString({ message: 'firmante es requerido y debe ser string' })
  firmante!: string;

  @IsString({ message: 'firmaDigital es requerida y debe ser string' })
  firmaDigital!: string;

  @IsOptional()
  @IsISO8601({}, { message: 'fechaFirma debe ser un ISO string válido' })
  fechaFirma?: string;
}
