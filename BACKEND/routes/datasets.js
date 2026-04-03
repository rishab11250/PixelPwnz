const express = require('express');
const router = express.Router();
const { getDatasets, createDataset, fetchNow } = require('../controllers/datasetController');

router.route('/').get(getDatasets).post(createDataset);
router.post('/fetch-now/:id', fetchNow);

module.exports = router;
