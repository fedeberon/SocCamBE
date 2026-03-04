module.exports = {
  async up(queryInterface, Sequelize) {
    const tableRef = { tableName: 'sos_movimientos', schema: 'dbo' };
    const table = await queryInterface.describeTable(tableRef);

    if (!table.montodebe) {
      await queryInterface.addColumn(tableRef, 'montodebe', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
      });
    }

    if (!table.montohaber) {
      await queryInterface.addColumn(tableRef, 'montohaber', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableRef = { tableName: 'sos_movimientos', schema: 'dbo' };
    const table = await queryInterface.describeTable(tableRef);

    if (table.montodebe) {
      await queryInterface.removeColumn(tableRef, 'montodebe');
    }

    if (table.montohaber) {
      await queryInterface.removeColumn(tableRef, 'montohaber');
    }
  },
};
