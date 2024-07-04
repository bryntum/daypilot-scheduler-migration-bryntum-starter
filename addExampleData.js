import { readFileSync } from "fs";
import sequelize from "./config/database.js";
import { Event, Resource, ResourceGroup } from "./models/index.js";

async function setupDatabase() {
  // Wait for all models to synchronize with the database
  await sequelize.sync();

  // Now add example data
  await addExampleData();
}

async function addExampleData() {
  try {
    // Read and parse the JSON data
    const eventsData = JSON.parse(readFileSync("./initialData/events.json"));
    const resource_groupsData = JSON.parse(
      readFileSync("./initialData/resource_groups.json")
    );
    const resourcesData = JSON.parse(
      readFileSync("./initialData/resources.json")
    );

    await sequelize.transaction(async (t) => {
      const events = await Event.bulkCreate(eventsData, { transaction: t });
      const resource_groups = await ResourceGroup.bulkCreate(
        resource_groupsData,
        {
          transaction: t,
        }
      );
      const resources = await Resource.bulkCreate(resourcesData, {
        transaction: t,
      });
      return { events, resource_groups, resources };
    });

    console.log(
      "events, resources_groups, and resources added to database successfully."
    );
  } catch (error) {
    console.error("Failed to add data to database due to an error: ", error);
  }
}

setupDatabase();