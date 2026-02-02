module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'servicio', schema: 'dbo' },
      'icono',
      {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'servicio', schema: 'dbo' },
      'icono',
    );
  },
};
