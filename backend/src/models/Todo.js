const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }  // auto adds createdAt and updatedAt fields
);

module.exports = mongoose.model('Todo', todoSchema);

// Why a Schema?
// MongoDB is schema-less by default, but Mongoose schemas add validation. If someone sends a request without a title, MongoDB will reject it cleanly with a message instead of saving garbage data.