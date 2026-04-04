const express = require('express');
const router = express.Router();
const { getDatasets, getDatasetById, createDataset, getDatasetForecast } = require('../controllers/datasetController');

router.route('/').get(getDatasets).post(createDataset);
router.route('/:id').get(getDatasetById);
router.route('/:id/forecast').get(getDatasetForecast);

module.exports = router;
