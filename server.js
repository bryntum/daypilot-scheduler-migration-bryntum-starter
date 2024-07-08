import bodyParser from "body-parser";
import express from "express";
import path from "path";
import {
  BryntumAssignment,
  BryntumEvent,
  BryntumResource,
  Event,
  Resource,
  ResourceGroup,
} from "./models/index.js";
import { localDateTimeISOString } from "./utils.js";

global.__dirname = path.resolve();

const port = 1337;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.static(path.join(__dirname, "/node_modules/@bryntum/scheduler"))
);
app.use(bodyParser.json());

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.findAll();
    const dataValues = events.map((event) => event.dataValues);
    const data = dataValues.map((event) => ({
      ...event,
      start: localDateTimeISOString(event.start),
      end: localDateTimeISOString(event.end),
    }));
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "There was an error fetching the events" });
  }
});

app.get("/api/resources", async (req, res) => {
  try {
    const resourcesPromise = Resource.findAll({ order: [["ordinal", "ASC"]] });
    const resource_groupsPromise = ResourceGroup.findAll({
      order: [["ordinal", "ASC"]],
    });
    const [resources, resource_groups] = await Promise.all([
      resourcesPromise,
      resource_groupsPromise,
    ]);

    const resourcesData = resource_groups.map((g) => {
      let newG = { ...g.dataValues };
      (newG.expanded = true),
        (newG.children = resources.filter((r) => r.group_id === g.id));
      return newG;
    });

    resource_groups.forEach((g) => {
      g.expanded = true;
      g.children = resources.filter((r) => r.group_id === g.id);
    });

    res.status(200).json(resourcesData);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "There was an error fetching the resources" });
  }
});

app.post("/api/createEvent", async (req, res) => {
  try {
    const data = await Event.create(req.body);
    const resData = {
      ...data.dataValues,
      start: localDateTimeISOString(data.dataValues.start),
      end: localDateTimeISOString(data.dataValues.end),
    };

    res.status(200).json(resData);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "There was an error creating the event" });
  }
});

app.post("/api/createGroup", async (req, res) => {
  try {
    const maxOrdinal = await ResourceGroup.max("ordinal");
    const modBody = { ...req.body, ordinal: maxOrdinal + 1 };

    const data = await ResourceGroup.create(modBody);
    res.status(200).json(data.dataValues);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "There was an error creating the resource group" });
  }
});

app.post("/api/createResource", async (req, res) => {
  try {
    const maxOrdinal = await ResourceGroup.max("ordinal");
    const modBody = { ...req.body, ordinal: maxOrdinal + 1 };
    const data = await Resource.create(modBody);
    res.status(200).json(data.dataValues);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "There was an error creating the resource" });
  }
});

app.post("/api/deleteGroup", async (req, res) => {
  const { id } = req.body;

  try {
    await ResourceGroup.destroy({
      where: {
        id: id,
      },
    });
    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json("There was an error deleting the resource group");
  }
});

app.post("/api/deleteResource", async (req, res) => {
  const { id } = req.body;
  try {
    await Resource.destroy({
      where: {
        id: id,
      },
    });
    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json("There was an error deleting the resource");
  }
});

app.post("/api/deleteEvent", async (req, res) => {
  const { id } = req.body;
  try {
    await Event.destroy({
      where: {
        id: id,
      },
    });
    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json("There was an error deleting the event");
  }
});

app.post("/api/updateResource", async (req, res) => {
  const { id, name } = req.body;
  try {
    await Resource.update({ name: name }, { where: { id } });
    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json("There was an error updating the resource");
  }
});

app.post("/api/updateGroup", async (req, res) => {
  const { id, name } = req.body;
  try {
    await ResourceGroup.update({ name: name }, { where: { id } });
    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json("There was an error updating the resource group");
  }
});

app.post("/api/moveEvent", async (req, res) => {
  const { id, ...data } = req.body;

  try {
    await Event.update(data, { where: { id } });
    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json("There was an error moving the event");
  }
});

app.post("/api/updateEvent", async (req, res) => {
  const { id, text } = req.body;

  try {
    await Event.update({ text: text }, { where: { id } });
    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json("There was an error updating the event");
  }
});

app.get("/api/load", async (req, res) => {
  try {
    const resourcesPromise = BryntumResource.findAll({
      order: [["index", "ASC"]],
    });
    const eventsPromise = BryntumEvent.findAll();
    const assignmentsPromise = BryntumAssignment.findAll();
    const [resources, events, assignments] = await Promise.all([
      resourcesPromise,
      eventsPromise,
      assignmentsPromise,
    ]);

    const resourcesMod = resources.map((resource) => {
      if (resource.parentId) {
        return { ...resource.dataValues };
      } else {
        return { ...resource.dataValues, expanded: true };
      }
    });

    res
      .send({
        resources: { rows: resourcesMod },
        events: { rows: events },
        assignments: { rows: assignments },
      })
      .status(200);
  } catch (error) {
    console.error({ error });
    res.send({
      success: false,
      message:
        "There was an error loading the resources, events, and assignments data.",
    });
  }
});

app.post("/api/sync", async function (req, res) {
  const { requestId, assignments, events, resources } = req.body;
  let eventMapping = {};

  try {
    const response = { requestId, success: true };
    if (resources) {
      const rows = await applyTableChanges("resources", resources);
      // if new data to update client
      if (rows) {
        response.resources = { rows };
      }
    }
    if (events) {
      const rows = await applyTableChanges("events", events);
      if (rows) {
        if (events?.added) {
          rows.forEach((row) => {
            eventMapping[row.$PhantomId] = row.id;
          });
        }
        response.events = { rows };
      }
    }
    if (assignments) {
      if (events && events?.added) {
        assignments.added.forEach((assignment) => {
          assignment.eventId = eventMapping[assignment.eventId];
        });
      }
      const rows = await applyTableChanges("assignments", assignments);
      if (rows) {
        response.assignments = { rows };
      }
    }
    res.send(response);
  } catch (error) {
    console.error({ error });
    res.send({
      requestId,
      success: false,
      message: "There was an error syncing the data changes.",
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

async function applyTableChanges(table, changes) {
  let rows;
  if (changes.added) {
    rows = await createOperation(changes.added, table);
  }
  if (changes.updated) {
    await updateOperation(changes.updated, table);
  }
  if (changes.removed) {
    await deleteOperation(changes.removed, table);
  }
  // if got some new data to update client
  return rows;
}

function createOperation(added, table) {
  return Promise.all(
    added.map(async (record) => {
      const { $PhantomId, ...data } = record;
      let id;
      // Insert record into the table.rows array
      if (table === "assignments") {
        const assignment = await BryntumAssignment.create(data);
        id = assignment.id;
      }
      if (table === "events") {
        const event = await BryntumEvent.create(data);
        id = event.id;
      }
      if (table === "resources") {
        // determine index number - add 1 to it
        // child resource
        if (data.parentId) {
          const maxIndex = await BryntumResource.max("index", {
            where: { parentId: data.parentId },
          });
          const resource = await BryntumResource.create({
            ...data,
            index: maxIndex + 1,
          });
          id = resource.id;
          // parent resource
        } else {
          const maxIndex = await BryntumResource.max("index", {
            where: { parentId: null },
          });
          const resource = await BryntumResource.create({
            ...data,
            index: maxIndex + 1,
          });
          id = resource.id;
        }
      }
      // report to the client that we changed the record identifier
      return { $PhantomId, id };
    })
  );
}

function deleteOperation(deleted, table) {
  return Promise.all(
    deleted.map(async ({ id }) => {
      if (table === "assignments") {
        await BryntumAssignment.destroy({
          where: {
            id: id,
          },
        });
      }
      if (table === "events") {
        await BryntumEvent.destroy({
          where: {
            id: id,
          },
        });
      }
      if (table === "resources") {
        await BryntumResource.destroy({
          where: {
            id: id,
          },
        });
      }
    })
  );
}

function updateOperation(updated, table) {
  return Promise.all(
    updated.map(async ({ id, ...data }) => {
      if (table === "assignments") {
        await BryntumAssignment.update(data, { where: { id } });
      }
      if (table === "events") {
        await BryntumEvent.update(data, { where: { id } });
      }
      if (table === "resources") {
        await BryntumResource.update(data, { where: { id } });
      }
    })
  );
}