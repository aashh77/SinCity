const mongoose = require('mongoose');
const Subject = require('./models/subjects'); 
require('dotenv').config();

// All character traits and secrets exactly as they were in your game
const subjects = [

    { 

        name: "Julian Vane", // Formerly PA-Julian 

        icon: "🧪", 

        bio: "An expert in synthetic toxins. Speaks with terrifying, clinical precision. He seems far too calm for a double homicide scene.", 

        secret: "Elias didn't die in that prison transport, Detective. He just found a better suit. Sarah was a loose end from Oakhaven that had to be cut.",

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

        bio: "Old money with a sharp tongue. She seems more worried about her reputation than the dead bodies in the suite.", 

        secret: "If the papers find out I was with the Guard, I'm finished. My husband would have me in the streets by morning.",

        patienceVal: 4, patienceMax: 4

    },

    { 

        name: "Marcus Thorne", // Formerly Guard

        icon: "🛡️", 

        bio: "Former military. He has a nervous facial tic and keeps checking the hallway cameras with trembling hands.", 

        secret: "I abandoned my post for a few minutes. If the Floor Manager finds out the VIP suite was unguarded on my watch, I'm done.",

        patienceVal: 8, patienceMax: 8

    },

    { 

        name: "Judge Halloway", // Formerly VIP-Deaf

        icon: "🧏", 

        bio: "A retired judge. He sits perfectly still, staring ahead. UNLESS THE USER SPEAKS IN ALL CAPS, HE JUST YELLS 'WHAT?!'", 

        secret: "I HEARD A LOUD THUD AROUND MIDNIGHT, BUT I COULDN'T TELL WHERE IT CAME FROM. MY HEARING ISN'T WHAT IT USED TO BE.",

        patienceVal: 10, patienceMax: 10

    },

    { 

        name: "Arthur Penhaligon", // Formerly VIP-Stammer

        icon: "😰", 

        bio: "A high-stakes gambler who has lost everything tonight. He's shaking and sweating profusely.", 

        secret: "The m-m-merger! If my name is tied to a murder investigation, the stocks will crash and my board of directors will ruin me. I saw a shadow in the hall, but I can't be involved!",

        patienceVal: 6, patienceMax: 6

    },

    { 

        name: "Manager Silas", // Formerly Manager

        icon: "💼", 

        bio: "Deeply in debt to the House. He needs this case closed quietly and quickly to avoid a scandal.", 

        secret: "The PD was ready to call it a heart attack before you showed up. Why can't you just sign the report so we can reopen the floor?",

        patienceVal: 5, patienceMax: 5

    },

    { 

        name: "Viktor Kross", // Formerly PA-Viktor

        icon: "👔", 

        bio: "A junior assistant who is visibly shaking. He looks like he's about to be sick and refuses to look anywhere near the crime scene.", 

        secret: "I... I don't know anything. I was just getting coffee when the lights went out. I'm just an assistant, please don't arrest me.",

        patienceVal: 6, patienceMax: 6

    },

    { 

        name: "Jax Miller", // Formerly PA-Jax

        icon: "🧥", 

        bio: "A quiet assistant who has gone completely pale. He's staring at a fixed point on the wall, paralyzed by the situation.", 

        secret: "I didn't see anything. I was just standing by the door. Everything happened so fast. I just want this to be over.",

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