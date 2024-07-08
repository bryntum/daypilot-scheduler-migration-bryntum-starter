import sequelize from "./config/database.js";
import BryntumAssignment from "./models/BryntumAssignment.js";
import BryntumEvent from "./models/BryntumEvent.js";
import BryntumResource from "./models/BryntumResource.js";
import { Event, Resource, ResourceGroup } from "./models/index.js";

async function setupDatabase() {
  // Wait for all models to synchronize with the database
  await sequelize.sync();

  // Now add example data
  await migrateExampleData();
}

async function migrateExampleData() {
  try {
    // Read the existing data
    const resource_groupsDataPromise = await ResourceGroup.findAll();
    const resourcesDataPromise = Resource.findAll();
    const eventsDataPromise = Event.findAll();

    const [resource_groupsData, resourcesData, eventsData] = await Promise.all([
      resource_groupsDataPromise,
      resourcesDataPromise,
      eventsDataPromise,
    ]);

    // transform data to match existing Bryntum data structure
    const bryntumResourcesData = [];
    const bryntumAssignmentsData = [];
    const bryntumEventsData = [];

    for (let resource_group of resource_groupsData) {
      const bryntumResource = {};
      bryntumResource.id = resource_group.id;
      bryntumResource.name = resource_group.name;
      bryntumResource.parentId = null;
      bryntumResource.index = resource_group.ordinal;
      bryntumResourcesData.push(bryntumResource);
    }

    for (let resource of resourcesData) {
      const bryntumResource = {};
      bryntumResource.id = resource.id;
      bryntumResource.name = resource.name;
      bryntumResource.parentId = resource.group_id;
      bryntumResource.index = resource.ordinal;
      bryntumResourcesData.push(bryntumResource);
    }

    for (let event of eventsData) {
      const bryntumAssignment = {};
      const bryntumEvent = {};

      bryntumAssignment.eventId = event.id;
      bryntumAssignment.resourceId = event.resource;
      bryntumEvent.id = event.id;
      bryntumEvent.name = event.text;
      bryntumEvent.startDate = event.start;
      bryntumEvent.endDate = event.end;

      bryntumAssignmentsData.push(bryntumAssignment);
      bryntumEventsData.push(bryntumEvent);
    }

    // add transformed data to Bryntum database tables
    await sequelize.transaction(async (t) => {
      const resources = await BryntumResource.bulkCreate(bryntumResourcesData, {
        transaction: t,
      });
      const events = await BryntumEvent.bulkCreate(bryntumEventsData, {
        transaction: t,
      });
      const assignments = await BryntumAssignment.bulkCreate(
        bryntumAssignmentsData,
        {
          transaction: t,
        }
      );
      return { resources, assignments, events };
    });

    console.log("Resources, assignments, and events migrated successfully.");
  } catch (error) {
    console.error("Failed to migrate data due to an error: ", error);
  }
}

setupDatabase();
