'use strict';
module.exports = (sequelize, DataTypes) => {
  var Project = sequelize.define('Project', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      primaryKey: true,
      allowNull: false
    },
    group_uuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slides: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {});
  Project.associate = function(models) {
    Project.belongsTo(models.Group);
  };
  return Project;
};
