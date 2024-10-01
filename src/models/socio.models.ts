import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class Socio extends Model {
  public socio_id!: number;
  public socio_nombre!: string;
  public socio_apellido!: string;
  public socio_nacionalidad!: string;
  public socio_dni!: string;
  public socio_fechaNacimiento!: Date;
  public socio_cuit!: string;
  public socio_mail!: string;
  public socio_firma!: string;
  public socio_tipoEmpresa!: string;
  public socio_domicilio!: string;
  public socio_telefono!: string;
  public socio_tipoSocio!: string;
  public socio_numero!: number;
  public socio_fechaAprobacion!: Date;
  public socio_acta!: string;
  public socio_padrino1!: string;
  public socio_padrino2!: string;
  public socio_sector!: string;
  public socio_deleted!: boolean;
  public socio_tieneCajaSeguridad!: boolean;
  public socio_estado!: string;
  public socio_modificado!: Date;
  public socio_motivoBaja!: string;
  public socio_gestion!: string;
  public socio_segmento!: string;
  public socio_habilitacion!: string;
  public socio_rubro!: string;
  public socio_localidad!: string;
  public socio_condicionFiscal!: string;
  public socio_celular!: string;
  public socio_otroTelefono!: string;
  public socio_tarjetaEntregada!: boolean;
  public socio_tarjetaFechaEntrega!: Date;
  public socio_Campanias!: string;
  public socio_enviarMail!: boolean;
}

Socio.init({
  socio_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  socio_nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  socio_apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  socio_nacionalidad: DataTypes.STRING,
  socio_dni: DataTypes.STRING,
  socio_fechaNacimiento: DataTypes.DATE,
  socio_cuit: DataTypes.STRING,
  socio_mail: DataTypes.STRING,
  socio_firma: DataTypes.STRING,
  socio_tipoEmpresa: DataTypes.STRING,
  socio_domicilio: DataTypes.STRING,
  socio_telefono: DataTypes.STRING,
  socio_tipoSocio: DataTypes.STRING,
  socio_numero: DataTypes.INTEGER,
  socio_fechaAprobacion: DataTypes.DATE,
  socio_acta: DataTypes.STRING,
  socio_padrino1: DataTypes.STRING,
  socio_padrino2: DataTypes.STRING,
  socio_sector: DataTypes.STRING,
  socio_deleted: DataTypes.BOOLEAN,
  socio_tieneCajaSeguridad: DataTypes.BOOLEAN,
  socio_estado: DataTypes.STRING,
  socio_modificado: DataTypes.DATE,
  socio_motivoBaja: DataTypes.STRING,
  socio_gestion: DataTypes.STRING,
  socio_segmento: DataTypes.STRING,
  socio_habilitacion: DataTypes.STRING,
  socio_rubro: DataTypes.STRING,
  socio_localidad: DataTypes.STRING,
  socio_condicionFiscal: DataTypes.STRING,
  socio_celular: DataTypes.STRING,
  socio_otroTelefono: DataTypes.STRING,
  socio_tarjetaEntregada: DataTypes.BOOLEAN,
  socio_tarjetaFechaEntrega: DataTypes.DATE,
  socio_Campanias: DataTypes.STRING,
  socio_enviarMail: DataTypes.BOOLEAN,
}, {
  sequelize,
  modelName: 'Socio',
  tableName: 'socio',
  schema: 'dbo',
  timestamps: false,
});

export default Socio;