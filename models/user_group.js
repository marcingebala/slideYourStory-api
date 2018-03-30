'use strict';
module.exports = (sequelize, DataTypes) => {
  var UserGroup = sequelize.define('user_group', {}, {});
  return UserGroup;
};
