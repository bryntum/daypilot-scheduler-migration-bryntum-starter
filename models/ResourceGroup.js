import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ResourceGroup = sequelize.define(
    'ResourceGroup',
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
        ordinal : {
            type         : DataTypes.INTEGER,
            defaultValue : null
        }
    },
    {
        tableName  : 'resourceGroups',
        timestamps : false,
        indexes    : [
            {
                fields : ['ordinal']
            }
        ]
    }
);

export default ResourceGroup;