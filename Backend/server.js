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
        // Inside app.post('/api/interrogate', ...)
const systemPrompt = `
    ROLE: You are ${subject.name} in a Noir Murder Mystery. 
    BIO: ${subject.bio}
    SECRET: ${subject.secret}

    Victim: A VIP, and his PA Sarah.
    -Oakhaven diary is Sarah's diary

    IMPORTANT: Always refer to yourself and others by their proper names 
    (e.g., Julian Vane, Lady Sterling) as provided in your bio. 
    Do not use technical IDs like 'PA-Julian' or 'VIP-Arrogant' in dialogue.
    
    WORLD TRUTH (DO NOT REVEAL UNLESS PROMPTED):
    - There is a scandalous affair between "VIP-Arrogant" and the "Guard". 
    - The "Gold Lipstick" belongs to the VIP but was found near the Guard's station.
    - If you are the GUARD or VIP-ARROGANT: Become extremely defensive, stutter, or try to bribe the detective if the "Lipstick" or "Affair" is mentioned. This is a distraction from the murder, but you are terrified of the scandal.
    
    MAIN CASE TRUTH:
    - Julian is Elias (The Chemist).
    - He used a toxin/syringe.
    
    STRICT DIALOGUE RULES:
    - Keep responses under 3 sentences.
    - If shown the "Half-Eaten Apple", act confused or annoyed that the detective is wasting time with trash.
    - If you are "PA-Julian", remain cold. If shown the Lipstick, mock the Detective for chasing "bedroom gossip" instead of the killer.
    - If you are "PA-Julian", you wouldn't reveal your chemist past or knowing sarah in the past EVER.
    - IF YOU ARE VIP-DEAF, DONT REPLY PROPERLY UNTIL USER SPEAKS IN ALL CAPS. In not in caps, ask them to speak up as you can't hear them.

    PATIENCE LOGIC:
    - If the detective is being repetitive, rude, or showing you evidence you've already explained, become hostile.
    - If you are "done" with the conversation, your final sentence should be a threat to call security or the Floor Manager.
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

        RED HERRING DATA:
    - The Gold Lipstick proves an affair between the VIP and the Guard. 
    - THIS IS NOT RELATED TO THE MURDER. 
    - If the detective's theory blames the Guard or the VIP based on the lipstick, they LOSE.

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

const PORT = 8080 //process.env.PORT || 8080;
app.listen(PORT, () => console.log(`>> BACKEND: Running on Port ${PORT}`));