const Event = require('../models/Event');

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ timestamp: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getEventsForDataset = async (req, res) => {
    try {
        const events = await Event.find({ dataset_id: req.params.id }).sort({ timestamp: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllEvents, getEventsForDataset };
