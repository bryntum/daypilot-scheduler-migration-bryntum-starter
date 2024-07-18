# Migrate from DayPilot Scheduler to Bryntum Scheduler: starter repository

## Getting started 

Install the dependencies:

```bash
npm install
```

Download the [DayPilot Pro Scheduler JavaScript code](https://javascript.daypilot.org/try/). The trial version is licensed for testing and evaluation purposes. The trial period is 60 days.
Copy the `scripts` folder and add it to the `public` directory.

Create and populate a local SQLite database by running the `addExampleData.js` Node script:

```bash
node addExampleData.js
```

Run the development server for this Express app using the following command:

```bash
npm run start
```
