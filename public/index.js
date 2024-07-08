import { Scheduler, StringHelper } from "./scheduler.module.js";

const scheduler = new Scheduler({
  appendTo: "app",
  viewPreset: "dayAndMonth",
  features: {
    // Turn the resource grid part of Scheduler into a tree
    tree: true,
  },
  eventRenderer({ renderData, eventRecord }) {
    renderData.eventColor = "#4b86b3";
    return StringHelper.xss`${eventRecord.name}`;
  },
  crudManager: {
    resourceStore: {
      transformFlatData: true,
      tree: true,
    },

    loadUrl: "http://localhost:1337/api/load",
    autoLoad: true,
    syncUrl: "http://localhost:1337/api/sync",
    autoSync: true,
    // This config enables response validation and dumping of found errors to the browser console.
    // It's meant to be used as a development stage helper only so please set it to false for production systems.
    validateResponse: true,
  },
  columns: [
    {
      type: "tree",
      text: "Name",
      field: "name",
      width: 180,
      htmlEncode: false,
      renderer({ record, value }) {
        if (!record.parentId) {
          return StringHelper.xss`
            <div class="info">
                <div class="name">${value}</div>
                <div class="add" data-btip="Add child"><i class="b-fa b-fa-plus"></i></div>
            </div>`;
        } else {
          return StringHelper.xss`${value}`;
        }
      },
    },
  ],
  tbar: {
    items: {
      addEventButton: {
        type: "button",
        icon: "b-icon b-icon-add",
        color: "b-green",
        text: "Add resource group",
        onAction: () => {
          scheduler.resourceStore.add({
            name: "New resource",
            parentId: null,
            expanded: true,
          });
        },
      },
    },
  },
  listeners: {
    cellClick({ record, event }) {
      // Add a new resource child when clicking plus icon
      if (event.target.closest(".add")) {
        record.appendChild({
          name: "New resource",
        });
      }
    },
  },
});
