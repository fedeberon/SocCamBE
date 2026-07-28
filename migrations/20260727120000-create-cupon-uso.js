module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cupon_uso', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      socio_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'socio',
          key: 'socio_id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      },
      socio_email: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      socio_nombre: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      cupon_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cupones',
          key: 'id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      },
      cupon_codigo: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      cupon_comercio: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      cupon_descuento: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      fecha_uso: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('GETDATE()'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cupon_uso');
  },
};
