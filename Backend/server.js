const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Subject = require('./models/subjects');
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(">> SYSTEM: Connected to SinCity Cloud Database"))
    .catch(err => console.error(">> ERROR: Database connection failed:", err));

// GET ALL SUBJECTS
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch subjects" });
    }
});

// INTERROGATION ROUTE
app.post('/api/interrogate', async (req, res) => {
    try {
        const { name, message } = req.body;
        const subject = await Subject.findOne({ name: name });
        if (!subject) return res.status(404).json({ response: "Not in records." });

        let response = "I've got nothing for you.";
        if (message.toLowerCase().includes("secret") || message.toLowerCase().includes("elias")) {
            response = subject.secret;
        }
        res.json({ response });
    } catch (err) {
        res.status(500).json({ response: "Connection Error" });
    }
});

app.listen(5000, () => console.log("Backend on Port 5000"));