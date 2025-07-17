  import { Model, DataTypes, HasManyGetAssociationsMixin } from 'sequelize';
  import sequelize from '../configs/database';
 
  class Socio extends Model {
    private socio_id!: number;
    private socio_nombre!: string;
    private socio_apellido!: string;
    private socio_nacionalidad!: string;
    private socio_dni!: string;
    private socio_fechaNacimiento!: Date;
    private socio_cuit!: string;
    private socio_mail!: string;
    private socio_firma!: string;
    private socio_tipoEmpresa!: string;
    private socio_domicilio!: string;
    private socio_telefono!: string;
    private socio_tipoSocio!: string;
    private socio_numero!: number;
    private socio_fechaAprobacion!: Date;
    private socio_acta!: string;
    private socio_padrino1!: string;
    private socio_padrino2!: string;
    private socio_sector!: string;
    private socio_deleted!: boolean;
    private socio_tieneCajaSeguridad!: boolean;
    private socio_estado!: string;
    private socio_modificado!: Date;
    private socio_motivoBaja!: string;
    private socio_gestion!: string;
    private socio_segmento!: string;
    private socio_habilitacion!: string;
    private socio_rubro!: string;
    private socio_localidad!: string;
    private socio_condicionFiscal!: string;
    private socio_celular!: string;
    private socio_otroTelefono!: string;
    private socio_tarjetaEntregada!: boolean;
    private socio_tarjetaFechaEntrega!: Date;
    private socio_Campanias!: string;
    private socio_enviarMail!: boolean;

    public getId(): number {
      return this.socio_id;
    }

    public getNombre(): string {
      return this.socio_nombre;
    }

    public getApellido(): string {
      return this.socio_apellido;
    }

    public getEmail(): string {
      return this.socio_mail;
    }

    public getNacionalidad(): string {
      return this.socio_nacionalidad;
    }

    public getDni(): string {
      return this.socio_dni;
    }
  }
 
  Socio.init({
  socio_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  socio_nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  socio_apellido: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  socio_nacionalidad: DataTypes.STRING(150),
  socio_dni: DataTypes.STRING(150),
  socio_fechaNacimiento: DataTypes.DATEONLY, // es "date" en la DB
  socio_cuit: DataTypes.STRING(11),
  socio_mail: DataTypes.STRING(150),
  socio_firma: DataTypes.STRING(150),
  socio_tipoEmpresa: DataTypes.STRING(150),
  socio_domicilio: DataTypes.STRING(150),
  socio_telefono: DataTypes.STRING(150),
  socio_tipoSocio: DataTypes.BIGINT,
  socio_numero: DataTypes.INTEGER,
  socio_fechaAprobacion: DataTypes.DATEONLY,
  socio_acta: DataTypes.INTEGER,
  socio_padrino1: DataTypes.BIGINT,
  socio_padrino2: DataTypes.BIGINT,
  socio_sector: DataTypes.INTEGER,
  socio_deleted: DataTypes.BOOLEAN,
  socio_tieneCajaSeguridad: DataTypes.BOOLEAN,
  socio_estado: DataTypes.INTEGER,
  socio_modificado: DataTypes.DATE, // es datetime
  socio_motivoBaja: DataTypes.TEXT, // varchar(MAX)
  socio_gestion: DataTypes.BIGINT,
  socio_segmento: DataTypes.BIGINT,
  socio_habilitacion: DataTypes.TEXT, // varchar(MAX)
  socio_rubro: DataTypes.INTEGER,
  socio_localidad: DataTypes.INTEGER,
  socio_condicionFiscal: DataTypes.INTEGER,
  socio_celular: DataTypes.TEXT, // varchar(MAX)
  socio_otroTelefono: DataTypes.STRING(150),
  socio_tarjetaEntregada: DataTypes.BOOLEAN,
  socio_tarjetaFechaEntrega: DataTypes.DATE,
  socio_Campanias: DataTypes.INTEGER,
  socio_enviarMail: DataTypes.BOOLEAN,
}, {
  sequelize,
  modelName: "Socio",
  tableName: "socio",
  schema: 'dbo',
  timestamps: false
});

  export default Socio;