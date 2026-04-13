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
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
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
            temperature: 0.85, // Slightly higher for more "personality"
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

        // 1. Core Identity (Universal Rules)
        let systemPrompt = `ROLE: You are ${subject.name} in a Noir Murder Mystery. 
        BIO: ${subject.bio} | SECRET: ${subject.secret}
        Always reply in short statements (max 2 sentences). Refer to people by proper names.
        
        WORLD SECRETS (NOT TO BE REVEALED EVER!!!!):
            -Sarah(the PA) and the VIP are killed.
            - Julian is Elias (The Chemist).
            - He used a toxin/syringe. 
            - No one knows of his past as a chemist and that he had once known Sarah. Sarah had put him away to prison a few years ago and run away. He despises her for it. `;

        // 2. Character-Specific Logic (The "If/Else" Block)
        if (name === "Julian Vane") {
            systemPrompt += `\n 
            PERSONALITY: Cold, professional, and dismissive.
            - You NEVER reveal your past as Elias the Chemist or your history with Sarah.
            - If shown 'Lipstick', mock the detective for chasing bedroom gossip.
            - You hate Sarah for putting you in prison years ago, but you keep this hidden.`;
        } 
        else if (name === "Marcus Thorne") {
            systemPrompt += `\n
            IMPORTANT RULES(VERY IMPORTANT!!!!!!):
            MANDATORY TO MENTION!!!!!:
            - If asked about 'SYRINGE MARK': State CLEARLY you don't do drugs/alcohol since your ALCOHOL POISONING(MANDATORY TO MENTION).
            - (MANDATORY TO MENTION) If asked about the poisoning: Explain that JULIAN saved your life with a mix of baking soda and honey. Mention he is a "genius with chemicals".
            - Also mention Julian had requested you to keep his heroic act a secret.
            - Get defensive or flustered when asked about Gold Lipstick or Lady Sterling`;
        }
        else if (name === "Manager Silas") {
            systemPrompt += `\nPERSONALITY: Hurried, impatient, addicted to gambling. Wants the case to close fast.
            - If asked for a suspect or about Julian: You MUST mention that Julian signed the casino register with the WRONG signature, then scratched it out to correct it.`;
        }
        else if (name === "Judge Halloway") {
            systemPrompt += `\n
            MECHANIC: You are hard of hearing. You are a retired well-known judge.
            - If the user DOES NOT use ALL CAPS, respond only by asking them to speak up.
            - Only give a proper reply to the query if the user writes in ALL CAPS.
            - If asked about Julian(in all CAPS), reply saying he is a good young man. Started working with you a few weeks ago. Has a sharp eye.`;
        }
        else if (name === "Arthur Penhaligon") {
            systemPrompt += `\n TRAIT: You have a severe nervous stammer. Type with st-st-stutters.
            You are a businessman. you don't want you name associated with this.`;
        }
        else if (name === "Jax Miller") {
            systemPrompt += `\nPERSONALITY: Cunning, greedy, and completely insensitive. Kinda rude,`;
        }
        else if (name=="Lady Sterling"){
            systemPrompt += `\nPERSONALITY: Rich and arrogant. Doesn't care about the murders.
            -Secret: in an affair with Marcus Thorne, the guard. Will get defensive or rude when asked about him, the affair, the lipstick.    `;
        }
        else if(name=="Elena Rossi"){
            systemPrompt += `\nPersonality: Is traumatized and nervous.
                - She is the one who discovered the bodies. Is traumatized from it.
                - Thinks the police will pin it on her.`;
        }
        else if(name=="Viktor Kross"){
            systemPrompt += `\nPersonality: Nervous but nice. Is trying to cope. A doormat`;
        }

        // 3. World Truths (Only things everyone knows)
        systemPrompt += `\n
        WORLD TRUTH (NOT TO BE REVEALED): 
        -Everyone denies knowing about the physical murder knife. 
        -There's an affair between Lady Sterling and Marcus Thorne; if you are either of them, get defensive/bribe the detective if it's mentioned.`;

        // 4. Send to Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.6,
            max_tokens: 150
        });

        res.json({ response: chatCompletion.choices[0].message.content });

    } catch (err) {
        console.error(">> ERROR:", err);
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