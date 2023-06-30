/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Messages', {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      from_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      to_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      media: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      seen: {
        type: DataTypes.ENUM('0','1'),
        allowNull: false,
        defaultValue: '0'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      }
    }, {
      sequelize,
      timestamps: false,
      tableName: 'messages'
    });
  };
  