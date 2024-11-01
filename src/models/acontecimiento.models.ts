import { Model, DataTypes, Association, HasManyGetAssociationsMixin } from 'sequelize';
import sequelize from '../configs/database';
import AcontecimientoUbicacion from './acontecimientoUbicacion.models';
import AcontecimientoCategoria from './acontecimientoCategoria.models';
import Socio from './socio.models';
import AcontecimientoSocio from './acontecimientoSocio.models';

class Acontecimiento extends Model {
  public acontecimiento_id!: number;
  public nombre!: string;
  public categoria_id!: number;
  public deleted!: boolean;
  public modificado!: Date;
  public ubicacion_id!: number;
  public fecha!: Date;
  public descripcion!: string;
  public ruta_archivo!: string;

  // Declaración de asociaciones
  public readonly ubicacion?: AcontecimientoUbicacion;
  public readonly categoria?: AcontecimientoCategoria;
  public readonly socios?: Socio[];

  public static associations: {
    ubicacion: Association<Acontecimiento, AcontecimientoUbicacion>;
    categoria: Association<AcontecimientoCategoria>;
    socios: Association<Acontecimiento, Socio>;
  };
}

Acontecimiento.init({
  acontecimiento_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  modificado: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ubicacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  descripcion: DataTypes.STRING,
  ruta_archivo: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'Acontecimiento',
  tableName: 'acontecimientos',
  schema: 'dbo',
  timestamps: false,
});

Acontecimiento.belongsTo(AcontecimientoUbicacion, {
  foreignKey: 'ubicacion_id',
  as: 'ubicacion'
});

Acontecimiento.belongsTo(AcontecimientoCategoria, {
  foreignKey: 'categoria_id',
  as: 'categoria'
});

Acontecimiento.belongsToMany(Socio, {
  through: AcontecimientoSocio,
  foreignKey: 'acontecimiento_id',
  otherKey: 'socio_id',
  as: 'socios'
});


export default Acontecimiento;