const Event = require('../models/Event');
const { generateEventExplanation, generateComprehensiveExplanation } = require('../services/aiService');

const enhanceEvent = (event, userId) => {
    const doc = event.toObject ? event.toObject() : event;
    const flaggedBy = doc.flagged_by || [];
    doc.flagged_count = flaggedBy.length;
    doc.user_flagged = userId ? flaggedBy.some((id) => String(id) === String(userId)) : false;

    if (userId && doc.flag_notes) {
        const note = doc.flag_notes.find((n) => String(n.user) === String(userId));
        doc.user_note = note ? note.text : '';
    } else {
        doc.user_note = '';
    }

    if (!userId) delete doc.flagged_by;
    delete doc.flag_notes;
    return doc;
};

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ timestamp: -1 });
        res.json(events.map((event) => enhanceEvent(event, req.user)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getEventsForDataset = async (req, res) => {
    try {
        const events = await Event.find({ dataset_id: req.params.id }).sort({ timestamp: -1 });
        res.json(events.map((event) => enhanceEvent(event, req.user)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getFlaggedEvents = async (req, res) => {
    try {
        const events = await Event.find({ flagged_by: req.user }).sort({ timestamp: -1 });
        res.json(events.map((event) => enhanceEvent(event, req.user)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const explainEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.ai_reason) {
            return res.json({ event: enhanceEvent(event, req.user) });
        }

        const insights = await generateComprehensiveExplanation(event);
        event.ai_reason = insights.reason;
        event.ai_action = insights.action;
        event.ai_impact = insights.impact;
        await event.save();

        res.json({ event: enhanceEvent(event, req.user) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const flagEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const userId = req.user;
        const alreadyFlagged = event.flagged_by.some((id) => String(id) === String(userId));

        if (alreadyFlagged) {
            event.flagged_by = event.flagged_by.filter((id) => String(id) !== String(userId));
        } else {
            event.flagged_by.push(userId);
        }
        event.flagged_count = event.flagged_by.length;

        if (req.body.requestAI && !event.ai_reason) {
            try {
                const insights = await generateComprehensiveExplanation(event);
                event.ai_reason = insights.reason;
                event.ai_action = insights.action;
                event.ai_impact = insights.impact;
            } catch(e) {
                console.error('Failed to analyze during flag:', e);
            }
        }

        await event.save();

        res.json({
            event: enhanceEvent(event, userId),
            flagged: !alreadyFlagged,
            flagged_count: event.flagged_count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateEventNote = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const userId = req.user;
        const { text } = req.body;

        const noteIndex = event.flag_notes.findIndex((n) => String(n.user) === String(userId));
        if (noteIndex !== -1) {
            event.flag_notes[noteIndex].text = text;
        } else {
            event.flag_notes.push({ user: userId, text });
        }

        await event.save();
        res.json({ event: enhanceEvent(event, userId) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllEvents, getEventsForDataset, getFlaggedEvents, explainEvent, flagEvent, updateEventNote };
