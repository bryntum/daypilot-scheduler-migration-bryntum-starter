import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import { Event, Resource, ResourceGroup } from './models/index.js';
import { localDateTimeISOString } from './utils.js';

global.__dirname = path.resolve();

const port = 1337;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.json());

app.get('/api/events', async(req, res) => {
    try {
        const events = await Event.findAll();
        const dataValues = events.map((event) => event.dataValues);
        const data = dataValues.map((event) => ({
            ...event,
            start : localDateTimeISOString(event.start),
            end   : localDateTimeISOString(event.end)
        }));
        res.status(200).json(data);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message : 'There was an error fetching the events' });
    }
});

app.get('/api/resources', async(req, res) => {
    try {
        const resourcesPromise = Resource.findAll({ order : [['ordinal', 'ASC']] });
        const resource_groupsPromise = ResourceGroup.findAll({
            order : [['ordinal', 'ASC']]
        });
        const [resources, resource_groups] = await Promise.all([
            resourcesPromise,
            resource_groupsPromise
        ]);

        const resourcesData = resource_groups.map((g) => {
            const newG = { ...g.dataValues };
            (newG.expanded = true),
            (newG.children = resources.filter((r) => r.group_id === g.id));
            return newG;
        });

        resource_groups.forEach((g) => {
            g.expanded = true;
            g.children = resources.filter((r) => r.group_id === g.id);
        });

        res.status(200).json(resourcesData);
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ message : 'There was an error fetching the resources' });
    }
});

app.post('/api/createEvent', async(req, res) => {
    try {
        const data = await Event.create(req.body);
        const resData = {
            ...data.dataValues,
            start : localDateTimeISOString(data.dataValues.start),
            end   : localDateTimeISOString(data.dataValues.end)
        };

        res.status(200).json(resData);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message : 'There was an error creating the event' });
    }
});

app.post('/api/createGroup', async(req, res) => {
    try {
        const maxOrdinal = await ResourceGroup.max('ordinal');
        const modBody = { ...req.body, ordinal : maxOrdinal + 1 };

        const data = await ResourceGroup.create(modBody);
        res.status(200).json(data.dataValues);
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ message : 'There was an error creating the resource group' });
    }
});

app.post('/api/createResource', async(req, res) => {
    try {
        const maxOrdinal = await ResourceGroup.max('ordinal');
        const modBody = { ...req.body, ordinal : maxOrdinal + 1 };
        const data = await Resource.create(modBody);
        res.status(200).json(data.dataValues);
    }
    catch (e) {
        console.error(e);
        res
            .status(500)
            .json({ message : 'There was an error creating the resource' });
    }
});

app.post('/api/deleteGroup', async(req, res) => {
    const { id } = req.body;

    try {
        await ResourceGroup.destroy({
            where : {
                id : id
            }
        });
        res.status(200).json({});
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error deleting the resource group');
    }
});

app.post('/api/deleteResource', async(req, res) => {
    const { id } = req.body;
    try {
        await Resource.destroy({
            where : {
                id : id
            }
        });
        res.status(200).json({});
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error deleting the resource');
    }
});

app.post('/api/deleteEvent', async(req, res) => {
    const { id } = req.body;
    try {
        await Event.destroy({
            where : {
                id : id
            }
        });
        res.status(200).json({});
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error deleting the event');
    }
});

app.post('/api/updateResource', async(req, res) => {
    const { id, name } = req.body;
    try {
        await Resource.update({ name : name }, { where : { id } });
        res.status(200).json({ success : true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error updating the resource');
    }
});

app.post('/api/updateGroup', async(req, res) => {
    const { id, name } = req.body;
    try {
        await ResourceGroup.update({ name : name }, { where : { id } });
        res.status(200).json({ success : true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error updating the resource group');
    }
});

app.post('/api/moveEvent', async(req, res) => {
    const { id, ...data } = req.body;

    try {
        await Event.update(data, { where : { id } });
        res.status(200).json({ success : true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error moving the event');
    }
});

app.post('/api/updateEvent', async(req, res) => {
    const { id, text } = req.body;

    try {
        await Event.update({ text : text }, { where : { id } });
        res.status(200).json({ success : true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json('There was an error updating the event');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});