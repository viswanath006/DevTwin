// REST API routes for user management - Updated
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

router.get('/users/:id', requireAuth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', requireAuth, async (req, res) => {
  try {
    const user = await userRepo.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
