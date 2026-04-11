const mongoose = require('mongoose');
const Subject = require('./models/subjects'); 
require('dotenv').config();

// All character traits and secrets exactly as they were in your game
const subjects = [
    { 
        name: "Elena", 
        icon: "🧹", 
        bio: "Casino maid. Knows the service vents.", 
        secret: "I wasn't in the room! The Guard and I were occupied in the closet.",
        patienceVal: 10,
        patienceMax: 10
    },
    { 
        name: "Manager", 
        icon: "💼", 
        bio: "Oversees floor operations. Deeply in debt.", 
        secret: "I hate VIPs, but I'm no killer.",
        patienceVal: 5,
        patienceMax: 5
    },
    { 
        name: "Guard", 
        icon: "🛡️", 
        bio: "Former military. Recently disciplined.", 
        secret: "The logs are fake. I was with Elena.",
        patienceVal: 8,
        patienceMax: 8
    },
    { 
        name: "VIP-Arrogant", 
        icon: "💎", 
        bio: "Old money. Hiding a scandal.", 
        secret: "I was having a 'private meeting'. Don't tell my wife.",
        patienceVal: 4,
        patienceMax: 4
    },
    { 
        name: "VIP-Stammer", 
        icon: "😰", 
        bio: "Regular gambler. Witnessed the event.", 
        secret: "I saw Julian hide a needle! He looked possessed!",
        patienceVal: 6,
        patienceMax: 6
    },
    { 
        name: "VIP-Deaf", 
        icon: "🧏", 
        bio: "Retired judge. Sharp eyes.", 
        secret: "WHAT? I saw that PA leaving the Chemist's room!",
        patienceVal: 10,
        patienceMax: 10
    },
    { 
        name: "PA-Julian", 
        icon: "🧪", 
        bio: "Expert in toxins. Extremely calm.", 
        secret: "Elias is dead, Detective. I am someone else now.",
        patienceVal: 5,
        patienceMax: 5
    },
    { 
        name: "PA-Viktor", 
        icon: "👔", 
        bio: "Junior assistant. Terrified.", 
        secret: "Julian is too calm. Cold as ice.",
        patienceVal: 6,
        patienceMax: 6
    },
    { 
        name: "PA-Jax", 
        icon: "🧥", 
        bio: "Security minded. Always recording.", 
        secret: "I saw someone in a lab coat. Julian's coat.",
        patienceVal: 5,
        patienceMax: 5
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