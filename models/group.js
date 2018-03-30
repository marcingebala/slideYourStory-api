'use strict';
module.exports = (sequelize, DataTypes) => {
  var Group = sequelize.define('Group', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {});
  Group.associate = function(models) {
    Group.belongsToMany(models.User, { through: 'UserGroup' });
    Group.hasMany(models.Project, {as: 'Projects'});
  };
return Group;
};
