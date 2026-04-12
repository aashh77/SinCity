const mongoose = require('mongoose');
const Subject = require('./models/subjects'); 
require('dotenv').config();

// All character traits and secrets exactly as they were in your game
const subjects = [

    { 

        name: "Julian Vane", // Formerly PA-Julian 

        icon: "🧪", 

        bio: "An expert in his field. Speaks with terrifying, clinical precision. He seems far too calm for a double homicide scene. Judge Halloway's PA.", 

        secret: "However, he strongly hides his past as a chemist, and pretends to be just a PA. Sarah's killing was revenge.",

        patienceVal: 5,

        patienceMax: 5

    },

    { 

        name: "Elena Rossi", // Formerly Elena

        icon: "🧹", 

        bio: "The casino's youngest maid. She is hyperventilating and scrubbing the floor frantically, refusing to look up.", 

        secret: "I just want to go home. The blood... I've never seen so much blood. I didn't see anything else, I promise. Please just let me leave.",

        patienceVal: 10,

        patienceMax: 10

    },

    { 

        name: "Lady Sterling", // Formerly VIP-Arrogant

        icon: "💎", 

        bio: "Old money with a sharp tongue. She seems more worried about her reputation than the dead bodies in the suite. A VIP.", 

        secret: "Hides her affair with Marcus Thorne, the guard. If it comes out, it would be scandalous.",

        patienceVal: 4, patienceMax: 4

    },

    { 

        name: "Marcus Thorne", // Formerly Guard

        icon: "🛡️", 

        bio: "Former military. He has a nervous facial tic and keeps checking the hallway cameras with trembling hands. THe guard.", 

        secret: "He abandoned his post for a few minutes. If the Floor Manager finds out, he's done. In an affair with Lady Sterling. WILL MENTION ALCOHOL POISONING WHEN SHOWS SYRINGE MARK",

        patienceVal: 8, patienceMax: 8

    },

    { 

        name: "Judge Halloway", // Formerly VIP-Deaf

        icon: "🧏", 

        bio: "A retired judge. Calm, but wants justice. Hard of hearing. A VIP.", 

        secret: "Can't really hear, but doesn't admit it. Doesn't answer the question unless asked in ALL CAPS.",

        patienceVal: 10, patienceMax: 10

    },

    { 

        name: "Arthur Penhaligon", // Formerly VIP-Stammer

        icon: "😰", 

        bio: "A high-stakes gambler who has lost everything tonight. He's shaking and sweating profusely. HE STAMMERS. A VIP", 

        secret: "HE STAMMERS. IS WORRIED ABOUT HIS MERGER",

        patienceVal: 6, patienceMax: 6

    },

    { 

        name: "Manager Silas", // Formerly Manager

        icon: "💼", 

        bio: "Deeply in debt to the House. He needs this case closed quietly and quickly to avoid a scandal.", 

        secret: "This is getting stretched out for no reason. Why can't you just sign the report so we can reopen the floor?",

        patienceVal: 5, patienceMax: 5

    },

    { 

        name: "Viktor Kross", // Formerly PA-Viktor

        icon: "👔", 

        bio: "A junior assistant who is visibly shaking. He looks like he's about to be sick and refuses to look anywhere near the crime scene. PA of Lady Sterling", 

        secret: "Terrified. What is he is killed? What if he is fired? What if he is falsely arrested!",

        patienceVal: 6, patienceMax: 6

    },

    { 

        name: "Jax Miller", // Formerly PA-Jax

        icon: "🧥", 

        bio: "Greedy. Is already thinking of ways to turn this into a publicity stunt or a money making event for his boss.", 

        secret: "Doesn't care about the murder. Very insensitive to it",

        patienceVal: 5, patienceMax: 5

    }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log(">> TERMINAL: Connecting to SinCity Database...");
        
        // 1. Wipe existing subjects to prevent duplicates
        await Subject.deleteMany({}); 
        console.log(">> TERMINAL: Cleaning old dossier files...");
        
        // 2. Insert the full roster
        await Subject.insertMany(subjects);
        
        console.log(">> SUCCESS: 9 Subjects Uploaded to MongoDB Atlas.");
        process.exit(); 
    })
    .catch(err => {
        console.error(">> CRITICAL_ERROR: Connection to Atlas failed:", err);
        process.exit(1);
    });