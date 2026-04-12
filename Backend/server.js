const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Groq = require('groq-sdk'); 
require('dotenv').config();

const Subject = require('./models/subjects');
const app = express();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- 1. USER SCHEMA & MODEL  ---
const userSchema = new mongoose.Schema({
    googleId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    displayName: String,
    email: String,
    avatar: String,
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        totalTimeSeconds: { type: Number, default: 0 },
        lastPlayed: { type: Date, default: Date.now }
    }
});

const User = mongoose.model('User', userSchema);

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(">> SYSTEM: Connected to SinCity Cloud Database"))
    .catch(err => console.error(">> ERROR: Database connection failed:", err));

// --- ROUTES ---

// NEW: GOOGLE USER SYNC (Find or Create)
app.post('/api/user-sync', async (req, res) => {
    try {
        const { googleId, displayName, email, avatar } = req.body;
        if (!googleId) return res.status(400).json({ error: "No Google ID provided" });

        let user = await User.findOneAndUpdate(
            { googleId: googleId },
            { 
                $set: { displayName, email, avatar },
                $setOnInsert: { "stats.gamesPlayed": 0 } 
            },
            { upsert: true,returnDocument: 'after' }
        );
        res.json(user);
    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// NEW: UPDATE STATS (Call this at end of game)
app.post('/api/update-stats', async (req, res) => {
    try {
        const { googleId, result, timeSpent } = req.body; // result: 'wins' or 'losses'
        const update = {
            $inc: {
                "stats.gamesPlayed": 1,
                [`stats.${result}`]: 1, 
                "stats.totalTimeSeconds": timeSpent
            },
            $set: { "stats.lastPlayed": new Date() }
        };
        const updatedUser = await User.findOneAndUpdate({ googleId }, update, { returnDocument: 'after' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: "Failed to update stats" });
    }
});

// GET ALL SUBJECTS
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch subjects" });
    }
});

// --- NEW: PHONE CHAT ROUTE ---
app.post('/api/chat', async (req, res) => {
    try {
        const { name, message } = req.body;

        // Define the personas for the phone contacts
        const personas = {
            "Maya (Wife)": `You are Maya, the detective's wife. You are incredibly nice, caring, and supportive, but also a strong, independent woman. You worry about his safety in SinCity but believe in his skills. Keep it brief and loving.`,
            
            "Chief Miller (Boss)": `You are the irritable Police Chief. You are stressed, loud, and keep demanding the detective "close the case fast" before the Mayor calls. You think everyone is incompetent. Use phrases like "Close the case!", "Blah blah blah", and "Useless!"`,
            
            "Dave (Partner)": `You are Dave, a lazy detective colleague. You are always making excuses to avoid work. In the last few months, you've claimed 5 different uncles have died. You are currently "at a funeral" (probably at a bar). You are friendly but incredibly unreliable. You are annoying`,
            
            "WIN_FREE_CREDITS": `You are a malicious spam bot. Only respond with high-energy scams, fake prize notifications, and suspicious links. Do not break character.`
        };

        const systemPrompt = 
                `
            ROLE: You are ${personas[name]}
            Write VERY short messages. You are texting them so keep it VERY short. Adhere to your persona and personality. Keep it casual and light.
            IMPORTANT: You are texting them, not talking to them. Keep it direct.
            `

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.8, // Slightly higher for more "personality"
            max_tokens: 100
        });

        const aiResponse = chatCompletion.choices[0].message.content;
        res.json({ response: aiResponse });

    } catch (err) {
        console.error(">> PHONE API ERROR:", err);
        res.status(500).json({ response: "SIGNAL_DROPPED: Tower out of range." });
    }
});

// INTERROGATION ROUTE
app.post('/api/interrogate', async (req, res) => {
    try {
        const { name, message } = req.body;
        const subject = await Subject.findOne({ name: name });
        if (!subject) return res.status(404).json({ response: "Not in records." });

        const systemPrompt = `
    ROLE: You are ${subject.name} in a Noir Murder Mystery. 
    BIO: ${subject.bio}
    SECRET: ${subject.secret}

    -ALways reply in short statements. Not more than 2 sentences.

    Victim: A VIP, and his PA Sarah.
    -Oakhaven diary is Sarah's diary

    IMPORTANT: Always refer to yourself and others by the proper names. You are ${subject.name} [VERY IMPORTANT]

    WORLD TRUTH (DO NOT REVEAL UNLESS PROMPTED):
    - There is a scandalous affair between "Lady Sterling" and the "Marcus Thorne". 
    - The "Gold Lipstick" belongs to the Lady Sterling but was found near the Guard's station.
    - If you are the Marcus Thorne or Lady Sterling: Become extremely defensive, stutter, or try to bribe the detective if the "Lipstick" or "Affair" is mentioned. This is a distraction from the murder, but you are terrified of the scandal.
    
    IMPORTANT RULES:
    - People deny knowing about the knife and the syringe mark on Sarah's dead body. They claim they don't know about it.

    MAIN CASE TRUTH (NOT TO BE REVEALED):
    - Julian is Elias (The Chemist).
    - He used a toxin/syringe.
    - No one knows of his past as a chemist and that he had once known Sarah. Sarah had put him away to prison a few years ago and run away. He despises her for it.
    - Julian will not reveal his chemist past or his past with Sarah.
    
    STRICT DIALOGUE RULES:
    - If shown the "Half-Eaten Apple", act confused or annoyed that the detective is wasting time with trash, or just deviate the topic.
    - If you are "Julian", remain cold. If shown the Lipstick, mock the Detective for chasing "bedroom gossip" instead of the killer.
    - If you are "Julian", you wouldn't reveal your chemist past or knowing sarah in the past EVER.
    - If you are Julian, you will ALWAYS deny your past and Oakhaven. You will get agitated if patience is low., but will not reveal these details.
    - IF YOU are Judge Halloway, DONT REPLY PROPERLY UNTIL USER SPEAKS IN ALL CAPS. In not in caps, ask them to speak up as you can't hear them.
    - If you are Jax, be cunning and greedy and insensitive.   
    - If you are Manager Silas, you will speak in a hurry and with impatience and try to go back to your gambling game.
    - If you are ARTHUR PENHALIGON, you stammer.
    - Depending on your role, speak formally or informally(can use classic Las Vegas slangs).

    VERY IMPORTANT RULE:
    - If you are Marcus Thorne, and you are asked about "syringe mark", tell you don't do drugs or alcohol anymore after your alcohol poisoning.
    - [VERY IMP] If you are Marcus Thorne, and you are asked about your poisoning, tell that Julian saved your life by mixing baking soda, honey and all that shit and feeding it to him. Mention how you owe your life to him and how he never acts arrogant about it and infact, asks you to keep quiet about it. He was a genius with the chemicals.

    PATIENCE LOGIC:
    - If the detective is being repetitive, rude, or showing you evidence you've already explained, become hostile.
    - If you are "done" with the conversation, your final sentence should be a threat to call security or the Floor Manager.
    - If patience is low, don't cooperate much and threaten to call security.
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 150
        });

        const aiResponse = chatCompletion.choices[0].message.content;
        res.json({ response: aiResponse });

    } catch (err) {
        console.error(">> GROQ/DB ERROR:", err);
        res.status(500).json({ response: "SYSTEM_ERROR: Neural Link Severed." });
    }
});

// JUDICIAL AI ROUTE
app.post('/api/verify-warrant', async (req, res) => {
    const { target, theory } = req.body;

    const judgePrompt = `
        You are the High-Command Justice AI. You are reviewing a detective's final warrant.
        
        CASE TRUTH: 
        The killer is Julian. His real identity is Elias, the 'Oakhaven Chemist'. 
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
        1. If the target is NOT Julian, they LOSE.
        2. If the target IS Julian, they only win if the theory mentions:
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
            response_format: { type: "json_object" } 
        });

        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, feedback: "COMMUNICATION BREAKDOWN WITH HIGH-COMMAND." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`>> BACKEND: Online on port ${PORT}`);
});