const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// GET /api/todos — fetch all todos, newest first
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/todos — create a new todo
router.post('/', async (req, res) => {
  try {
    const todo = new Todo({ title: req.body.title });
    const saved = await todo.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: err.message });
  }
});

// PUT /api/todos/:id — toggle completed true/false
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    todo.completed = !todo.completed;
    const updated = await todo.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

// DELETE /api/todos/:id — delete a todo by id
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    await todo.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

module.exports = router;

// Why these 4 routes?
// This is standard CRUD — Create, Read, Update, Delete. It's the minimum needed to prove the frontend and backend talk to each other and MongoDB is persisting data. Every DevOps concept (health checks, rolling updates, persistent volumes) can be demonstrated with just this.