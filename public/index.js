const btnAddGroup = document.getElementById("btnAddGroup");

const dp = new DayPilot.Scheduler("dp", {
  startDate: "2024-07-09",
  days: 365,
  scale: "Day",
  timeHeaders: [
    { groupBy: "Month", format: "MMMM yyyy" },
    { groupBy: "Day", format: "d" },
  ],
  contextMenuResource: new DayPilot.Menu({
    onShow: (args) => {
      const row = args.source;
      const hasParent = !!row.parent();
      dp.contextMenuResource.items[0].hidden = hasParent;
    },
    items: [
      {
        text: "Add resource...",
        onClick: (args) => {
          dp.clickAddResource(args.source);
        },
      },
      {
        text: "Edit...",
        onClick: async (args) => {
          const form = [{ name: "Name", id: "name" }];
          const isGroup = !args.source.data.group_id;
          const id = args.source.data.id;
          const name = args.source.data.name;
          const formData = {
            id,
            name,
          };
          const modal = await DayPilot.Modal.form(form, formData);
          if (modal.canceled) {
            return;
          }
          const newName = modal.result.name;
          const data = {
            id,
            name: newName,
          };
          const url = isGroup ? "/api/updateGroup" : "/api/updateResource";
          const updateGRes = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          await updateGRes.json();

          const row = dp.rows.find(args.source.data.id);
          row.data.name = newName;
          dp.update();
        },
      },
      {
        text: "Delete",
        onClick: async (args) => {
          const row = args.source;
          if (row.data.group_id) {
            await fetch("/api/deleteResource", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id: row.data.id }),
            });
          } else {
            await fetch("/api/deleteGroup", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id: row.data.id }),
            });
          }
          dp.rows.remove(row.data.id);
        },
      },
    ],
  }),
  treeEnabled: true,
  onRowCreate: (args) => {
    dp.resources.push({
      name: args.text,
    });
    dp.update();
  },
  heightSpec: "Max",
  height: "Parent100Pct",
  eventMovingStartEndEnabled: true,
  eventResizingStartEndEnabled: true,
  timeRangeSelectingStartEndEnabled: true,
  contextMenu: new DayPilot.Menu({
    items: [
      {
        text: "Edit",
        onClick: async (args) => {
          // The `args.source` object holds the event object
          const form = [{ name: "Text", id: "text" }];
          const modal = await DayPilot.Modal.form(form);
          if (modal.canceled) {
            return;
          }

          const text = modal.result.text;

          await fetch("/api/updateEvent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: args.source.data.id, text: text }),
          });

          dp.events.update({ ...args.source.data, text });
        },
      },
      {
        text: "Delete",
        onClick: async (args) => {
          const { id } = args.source.data;
          await fetch("/api/deleteEvent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
          });
          dp.events.remove(id);
        },
      },
    ],
  }),
  // equivalent to Bryntum tooltip
  bubble: new DayPilot.Bubble({
    onLoad: (args) => {
      const e = args.source;
      const text = DayPilot.Util.escapeHtml(e.text());
      const start = e.start().toString("M/d/yyyy h:mm tt");
      const end = e.end().toString("M/d/yyyy h:mm tt");
      args.html = `<div><b>${text}</b></div><div>Start: ${start}</div><div>End: ${end}</div>`;
    },
  }),

  onTimeRangeSelected: async (args) => {
    const modal = await DayPilot.Modal.prompt("New event name:", "New Event");
    dp.clearSelection(); // clears the current Scheduler time range selection.
    if (modal.canceled) {
      return;
    }
    const name = modal.result;
    const data = {
      start: args.start,
      end: args.end,
      resource: args.resource,
      text: name,
    };
    const createEventRes = await fetch("/api/createEvent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const createEventResData = await createEventRes.json();
    dp.events.add(createEventResData);
  },
  onEventMoved: async (args) => {
    const updateData = {
      id: args.e.data.id,
      start: args.newStart,
      end: args.newEnd,
      resource: args.newResource,
    };
    await fetch("/api/moveEvent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
  },
  onEventResized: async (args) => {
    const updateData = {
      id: args.e.data.id,
      start: args.newStart,
      end: args.newEnd,
      resource: args.e.data.resource,
    };
    await fetch("/api/moveEvent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
  },
  async clickAddResource(group) {
    const form = [{ name: "Name", id: "name" }];
    const modal = await DayPilot.Modal.form(form);
    if (modal.canceled) {
      return;
    }

    const name = modal.result.name;
    const group_id = group.data.id;

    const createResourceRes = await fetch("/api/createResource", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, group_id }),
    });
    const createResourceResData = await createResourceRes.json();

    if (!group.data.children) {
      group.data.children = [];
    }

    group.data.children.push(createResourceResData);
    dp.update();
  },

  async clickAddGroup(e) {
    const form = [{ name: "Name", id: "name" }];
    const modal = await DayPilot.Modal.form(form);
    if (modal.canceled) {
      return;
    }

    const name = modal.result.name;
    const createResourceGroupRes = await fetch("/api/createGroup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const createResourceGroupResData = await createResourceGroupRes.json();

    dp.rows.add(createResourceGroupResData);
  },
});

dp.init();

const app = {
  barColor(i) {
    return "#3c78d8";
  },
  barBackColor(i) {
    return "#a4c2f4";
  },  
  async loadData() {
    const promiseResources = fetch("/api/resources");
    const promiseEvents = fetch("/api/events");
    const [ resourcesRes, eventsRes ] = await Promise.all([
      promiseResources,
      promiseEvents,
    ]);
    const events = await eventsRes.json();
    const resources = await resourcesRes.json();
    dp.update({ resources, events });
  },
};

app.loadData();

btnAddGroup.addEventListener("click", dp.clickAddGroup);