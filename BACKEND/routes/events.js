const express = require('express');
const router = express.Router();
const { getAllEvents, getEventsForDataset } = require('../controllers/eventController');

router.get('/events', getAllEvents);
router.get('/datasets/:id/events', getEventsForDataset);

module.exports = router;
