const mongoose = require('mongoose');

// This is the blueprint for a suspect in your database
const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: String,
    bio: String,
    secret: String,
    patienceVal: Number,
    patienceMax: Number
});

module.exports = mongoose.model('Subject', subjectSchema);