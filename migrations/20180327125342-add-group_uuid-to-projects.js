'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Projects',
      'group_uuid',
      {
        type: Sequelize.UUID,
        references: {
          model: 'Groups',
          key: 'uuid'
        },
        allowNull: false
      });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Projects', 'group_uuid');
  }
};
