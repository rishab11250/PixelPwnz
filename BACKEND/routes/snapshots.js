const express = require('express');
const router = express.Router({ mergeParams: true });
const { getSnapshotsForDataset } = require('../controllers/snapshotController');

router.get('/:id/snapshots', getSnapshotsForDataset);

module.exports = router;
