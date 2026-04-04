const Dataset = require('../models/Dataset');
const Snapshot = require('../models/Snapshot');
const { fetchSingleDataset } = require('../services/fetcher');
const { generateFullForecastChart } = require('../services/aiService');

const getDatasets = async (req, res) => {
    try {
        const datasets = await Dataset.find();
        res.json(datasets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDatasetById = async (req, res) => {
    try {
        const dataset = await Dataset.findById(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
        res.json(dataset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createDataset = async (req, res) => {
    try {
        const dataset = await Dataset.create(req.body);
        res.status(201).json(dataset);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const fetchNow = async (req, res) => {
    try {
        const dataset = await Dataset.findById(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const fetched = await fetchSingleDataset(dataset.name);

        if (fetched) {
            res.json({ message: `Manual fetch completed for ${dataset.name}` });
        } else {
            res.status(400).json({ error: 'No fetcher available for this dataset' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDatasetForecast = async (req, res) => {
    try {
        const dataset = await Dataset.findById(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

        const snapshots = await Snapshot.find({ dataset_id: req.params.id })
            .sort({ timestamp: -1 })
            .limit(48);
        
        if (snapshots.length < 5) {
            return res.json({ forecast: [], summary: 'Insufficient data for forecasting' });
        }

        const forecast = await generateFullForecastChart(dataset, snapshots.reverse());
        res.json(forecast);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getDatasets, getDatasetById, createDataset, fetchNow, getDatasetForecast };
