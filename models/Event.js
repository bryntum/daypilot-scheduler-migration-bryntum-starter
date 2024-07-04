import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    end: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    resource: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
  },
  {
    tableName: "events",
    timestamps: false,
    indexes: [
      {
        fields: ["start", "end", "resource"],
      },
    ],
  }
);

export default Event;