module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asignar_cupon', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,      // <-- clave primaria definida
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: queryInterface.sequelize.literal('GETDATE()'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: queryInterface.sequelize.literal('GETDATE()'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('asignar_cupon');
  }
};
