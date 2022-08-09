const { Router } = require('express');
const router = Router();
const Secret = require('../models/secrets');

module.exports = router
  .get('/', async (req, res, next) => {
    try {
      const response = await Secret.getAll();
      res.json(response);
    } catch (e) {
      next(e);
    }
  });
