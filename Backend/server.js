const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import the Model we created in Phase 1
const Subject = require('./models/subjects');

const app = express();

// Middleware
app.use(cors()); // Essential for frontend-backend communication
app.use(express.json()); // Allows the server to read JSON data from the frontend

// 1. Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(">> SYSTEM: Connected to SinCity Cloud Database"))
    .catch(err => console.error(">> ERROR: Database connection failed:", err));

// 2. The Interrogation Route (The "Brain")
app.post('/api/interrogate', async (req, res) => {
    try {
        const { name, message } = req.body;

        // Fetch the character dossier from MongoDB
        const subject = await Subject.findOne({ name: name });

        if (!subject) {
            return res.status(404).json({ response: "Subject not found in city records." });
        }

        let response = "I've got nothing for you, Detective.";
        const msg = message.toLowerCase();

        // Check for keywords to trigger the secret (Your game logic)
        // You can add more keywords here to make the game harder!
        if (msg.includes("elias") || msg.includes("oakhaven") || msg.includes("secret") || msg.includes("affair")) {
            response = subject.secret;
        }

        // Return the response to the frontend
        res.json({ response });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ response: "TERMINAL ERROR: Signal lost..." });
    }
});

// 3. Optional: Route to get all characters (Useful for the UI)
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch subjects" });
    }
});

// 4. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`>> SYSTEM: SinCity Backend active on Port ${PORT}`);
});