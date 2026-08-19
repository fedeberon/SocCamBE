module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campania', {
      campania_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.STRING(2000),
        allowNull: true,
      },
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      imagen_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      fecha_inicio: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'borrador',
      },
      descuento: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      terminos: {
        type: Sequelize.STRING(2000),
        allowNull: true,
      },
      creado_en: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('GETDATE()'),
      },
      modificado_en: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.createTable('socio_campania', {
      socio_campania_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      socio_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'socio',
          key: 'socio_id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      },
      campania_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'campania',
          key: 'campania_id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      },
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      aceptado_en: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notas: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      creado_en: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('GETDATE()'),
      },
    });

    await queryInterface.addIndex('socio_campania', ['socio_id', 'campania_id'], {
      unique: true,
      name: 'uq_socio_campania',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('socio_campania');
    await queryInterface.dropTable('campania');
  },
};
