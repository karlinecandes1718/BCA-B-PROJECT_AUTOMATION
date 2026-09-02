const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/keywords', aiController.formatActivity);

module.exports = router;
