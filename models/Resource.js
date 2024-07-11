import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Resource = sequelize.define(
    'Resource',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : false
        },
        group_id : {
            type         : DataTypes.INTEGER,
            defaultValue : null
        },
        ordinal : {
            type         : DataTypes.INTEGER,
            defaultValue : null
        }
    },
    {
        tableName  : 'resources',
        timestamps : false,
        indexes    : [
            {
                fields : ['ordinal', 'group_id']
            }
        ]
    }
);

export default Resource;
