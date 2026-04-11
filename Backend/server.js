const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Groq = require('groq-sdk'); // 1. Import Groq
require('dotenv').config();

const Subject = require('./models/subjects');
const app = express();

// 2. Initialize Groq with your API Key from .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(">> SYSTEM: Connected to SinCity Cloud Database"))
    .catch(err => console.error(">> ERROR: Database connection failed:", err));

// GET ALL SUBJECTS (For the Sidebar/Patience bars)
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch subjects" });
    }
});

// INTERROGATION ROUTE (Now Powered by Llama 3)
app.post('/api/interrogate', async (req, res) => {
    try {
        const { name, message } = req.body;
        
        // 3. Find the specific character's "Soul" from MongoDB
        const subject = await Subject.findOne({ name: name });
        if (!subject) return res.status(404).json({ response: "Not in records." });

        // 4. Construct the System Prompt (The AI's "Acting Script")
        const systemPrompt = `
            ROLE: You are ${subject.name} in a Noir Murder Mystery. 
            BIO: ${subject.bio}
            SECRET: ${subject.secret}
            LOCATION: Grand Casino VIP Suite.

            STRICT DIALOGUE RULES:
            - You are a real person, not an AI. Do not use robotic phrases.
            - Keep responses short (max 2-3 sentences).
            - Be immersive. Use noir-style slang or professional jargon fitting your bio.
            - DO NOT reveal your secret immediately. 
            - If you are "PA-Julian", be helpful but cold. Hide your past as "Elias".
            - If the player mentions "Oakhaven", "The Chemist", or "Sarah", become visibly tense/defensive in your words.
            - Adhere to your personality as the role you are playing.
            - If you are the deaf vip, you dont respond properly until spoken to in all caps. Else, you just ask them to speak up.
        `;

        // 5. Send the request to Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant", // Fast, smart, and perfect for character roleplay
            temperature: 0.7,        // Adds a bit of creative "personality"
            max_tokens: 150          // Keeps them from rambling
        });

        // 6. Return the AI's response to the frontend
        const aiResponse = chatCompletion.choices[0].message.content;
        res.json({ response: aiResponse });

    } catch (err) {
        console.error(">> GROQ/DB ERROR:", err);
        res.status(500).json({ response: "SYSTEM_ERROR: Neural Link Severed." });
    }
});

// --- THE JUDICIAL AI ROUTE ---
app.post('/api/verify-warrant', async (req, res) => {
    const { target, theory } = req.body;

    const judgePrompt = `
        You are the High-Command Justice AI. You are reviewing a detective's final warrant.
        
        CASE TRUTH: 
        The killer is PA-Julian. His real identity is Elias, the 'Oakhaven Chemist'. 
        MOTIVE: Revenge against Sarah (the victim) for snitching on him 3 years ago. 
        METHOD: He used plastic surgery to hide his face and a custom synthetic toxin (injected via syringe) to kill her.
        The VIP killed was because of him being at the wrong place at the wrong time. Sarah was the real target.

        DETECTIVE'S ACCUSATION: ${target}
        DETECTIVE'S THEORY: "${theory}"

        EVALUATION RULES:
        1. If the target is NOT PA-Julian, they LOSE.
        2. If the target IS PA-Julian, they only win if the theory mentions:
           - His past as Elias or Oakhaven.
           - Revenge or the snitching incident.
           - The use of toxins/chemistry.

        RESPONSE FORMAT:
        Return a JSON object: 
        { "success": true/false, "feedback": "A noir-style message from High Command explaining the outcome." }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: judgePrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" } // Force JSON output
        });

        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, feedback: "COMMUNICATION BREAKDOWN WITH HIGH-COMMAND." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`>> BACKEND: Running on Port ${PORT}`));