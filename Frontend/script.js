const GameState = {
    time: 1440,
    playerName: "Detective",
    currentLoc: "VIP Suite",
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    currentTarget: null,
    patience: {}, 

   evidenceMeta: { 
    "Pocket Knife": "🔪", 
    "Post-Mortem Report": "📄", 
    "Syringe Mark": "💉", 
    "Oakhaven Diary": "📓", 
    "Drug Database": "💾", 
    "Casino Ledger": "📊",
    "Gold Lipstick": "💄",    // New: Affair clue
    "Half-Eaten Apple": "🍎", // New: Useless clue
    "Crumpled Note": "📝"     // New: Red herring
},

// --- UPDATED LOCATIONS (Redistributed Clues) ---
locations: {
    "VIP Suite": { chars: ["Elena", "PA-Julian", "VIP-Arrogant"], clue: "Oakhaven Diary" },
    "Main Floor": { chars: ["Manager", "Guard", "VIP-Stammer"], clue: "Gold Lipstick" }, // Found near the Guard
    "Bar Lounge": { chars: ["VIP-Deaf", "PA-Viktor", "PA-Jax"], clue: "Half-Eaten Apple" } // Useless
},

    async init() {
    try {
        // MATCH THE PORT AND IP EXACTLY
        const response = await fetch('http://127.0.0.1:8080/api/subjects');
        const data = await response.json();
        
        // Convert the array from DB into your patience object
        this.patience = {};
        data.forEach(s => {
            this.patience[s.name] = {
                val: s.patienceVal || 5,
                max: s.patienceMax || 5,
                icon: s.icon,
                bio: s.bio,
                secret: s.secret
            };
        });

        this.renderMap();
        this.updateUI();
        UI.log("NEURAL LINK ESTABLISHED. DATABASE ONLINE.", "text-green-500 font-bold");

    } catch (err) {
        console.error("Connection failed:", err);
        UI.log("DATABASE OFFLINE. LOCAL RECORDS ONLY.", "text-red-500 font-bold");
        // Fallback to local data if needed...
    }
},
    // Inside GameState object
startClock() {
    // Clear any existing clock first to prevent "double speed" timers
    if (this.gameClockInterval) clearInterval(this.gameClockInterval);

    // Using an arrow function () => ensures 'this' refers to GameState
    this.gameClockInterval = setInterval(() => {
        this.time -= 1;
        
        // Debugging: This will show in your F12 console to prove it's ticking
        console.log("Tick... Time remaining:", this.time);

        this.updateUI();

        if (this.time <= 0) {
            this.gameOver("TIME EXPIRED: The killer has escaped the city.");
        }
    }, 1000); 
},

// REPLACE this in GameState object in script.js
gameOver(type, narrative) {
    // 1. Core logical shutdown
    if (this.gameClockInterval) clearInterval(this.gameClockInterval);
    document.getElementById('player-input').disabled = true;

    // 2. Map visual data based on ending type
    const endData = {
        WIN: {
            header: "CASE_CLOSED",
            headerClass: "text-green-500 shadow-[0_0_30px_#00ff00] font-black",
            image: "https://images.unsplash.com/photo-1598048145802-58e1b1d44093?q=80&w=600" // A high-contrast handcuffs shot
        },
        LOSS: {
            header: "STATUS_TERMINATED",
            headerClass: "text-red-600 shadow-[0_0_30px_#ff0000] font-black",
            image: "https://images.unsplash.com/photo-1579783901586-d88db74b4fe1?q=80&w=600" // A cinematic "escaping into the rain" shot
        }
    };

    const data = endData[type] || endData.LOSS; // Default to Loss if type is weird

    // 3. Populate and show the End Screen
    const screen = document.getElementById('end-screen');
    const header = document.getElementById('end-status-header');
    const img = document.getElementById('end-image');
    const aiFeedback = document.getElementById('end-ai-feedback');

    if (screen && header && img && aiFeedback) {
        header.innerText = data.header;
        header.className = data.headerClass; // Applies neon red or green
        img.src = data.image;
        screen.classList.remove('hidden'); // Show the modal

        // Using a slight delay to trigger the fade-in effect properly
        setTimeout(() => {
            UI.typeLogNarrative("end-ai-feedback", narrative); // Unique typeLog for the end screen
        }, 1500);
    }
},

    // --- CRIMINAL DATABASE LOGIC ---
    openDatabase() {
        const input = document.getElementById('db-query-input');
        const display = document.getElementById('db-results');
        const query = input.value.trim().toLowerCase();
        
        if (!query) return;

        display.innerHTML = `<p class="animate-pulse text-cyan-700">> SEARCHING ARCHIVES...</p>`;

        setTimeout(() => {
            if (query.includes("sarah") || query.includes("oakhaven") || query.includes("elias")) {
                display.innerHTML = `
                    <div class="border border-yellow-500/50 p-3 bg-yellow-950/20 rounded mb-2">
                        <p class="text-yellow-500 font-bold">[FILE FOUND: OAKHAVEN_2021]</p>
                        <p class="text-white"><span class="text-cyan-500">SUBJECT:</span> Sarah [DECEASED]</p>
                        <p class="text-white"><span class="text-cyan-500">RECORD:</span> Former associate of the Oakhaven Drug Ring.</p>
                        <p class="text-white"><span class="text-cyan-500">INTEL:</span> Provided state evidence against lead chemist **'ELIAS'**. Elias disappeared during prison transport 2 years ago.</p>
                        <hr class="border-yellow-900 my-2">
                        <p class="italic text-[10px] text-yellow-200/70">"Note: Elias is a master of synthetic toxins. Extreme caution advised."</p>
                    </div>`;
            } else {
                display.innerHTML = `<p class="text-red-500">> NO DATA MATCHES FOR: ${query.toUpperCase()}</p>`;
            }
        }, 800);
    },

    // --- WARRANT SYSTEM LOGIC ---
    // --- AI-POWERED WARRANT CHECK ---
// REPLACE this in GameState object in script.js
async submitFinalTheory() {
    const target = document.getElementById('arrest-select').value;
    const theory = document.getElementById('theory-input').value;

    if (theory.length < 20) {
        UI.log("THEORY TOO BRIEF. HIGH-COMMAND WILL REJECT THIS.", "text-red-500");
        return;
    }

    UI.toggleAccusation();
    UI.log(`TRANSMITTING WARRANT FOR ${target.toUpperCase()} TO HIGH-COMMAND...`, "text-yellow-500 blink");

    try {
        const response = await fetch('http://127.0.0.1:8080/api/verify-warrant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, theory })
        });

        const result = await response.json();

        // 4. Pass results to gameOver, rather than a text log
        if (result.success) {
            this.gameOver("WIN", result.feedback); // Calls victory cinematic
        } else {
            this.gameOver("LOSS", result.feedback); // Calls failure cinematic
        }

    } catch (err) {
        UI.log("WARRANT TRANSMISSION FAILED.", "text-red-600");
    }
},

    handleInput() {
        const input = document.getElementById('player-input');
        const raw = input.value.trim();
        if (!raw) return;
        const cmd = raw.toUpperCase();

        if (cmd.startsWith("TALK TO")) {
            const name = Object.keys(this.patience).find(n => cmd.includes(n.toUpperCase()));
            if (name) this.selectTarget(name);
        } else if (cmd === "SEARCH") {
            this.handleSearch();
        } else if (cmd.includes("DATABASE")) {
            UI.toggleDatabase();
        } else if (cmd.includes("WARRANT")) {
            UI.toggleAccusation();
        } else if (this.currentTarget) {
            this.aiTalk(this.currentTarget, raw);
        }
        input.value = "";
    },

    handleSearch() {
    const clue = this.locations[this.currentLoc].clue;
    // This will now correctly pull "Gold Lipstick" if you are on the Main Floor
    if (clue && !this.inventory.includes(clue)) {
        this.inventory.push(clue);
        UI.log(`INTEL RECOVERED: ${clue.toUpperCase()}`, "text-yellow-400 font-bold");
        this.updateUI();
    } else {
        UI.log("AREA CLEARED. NO NEW EVIDENCE FOUND.", "text-slate-500");
    }
},

    selectTarget(name) {
        this.currentTarget = name;
        this.updateUI();
        UI.log(`INTERROGATING: ${name.toUpperCase()}`, "text-cyan-400 font-bold");
    },

    async aiTalk(name, message) {
    UI.log(`YOU: "${message}"`, "italic text-slate-400 font-bold");
    
    const subject = this.patience[name];

    // --- NEW SECURITY TRIGGER ---
    if (subject && subject.val <= 0) {
        this.triggerSecurityIncident(name);
        return;
    }

    const thinkingId = `think-${Date.now()}`;
    UI.log(`${name.toUpperCase()} IS RESPONDING...`, "text-cyan-900 animate-pulse text-[8px] tracking-[0.2em]", thinkingId);

    try {
        const response = await fetch('http://127.0.0.1:8080/api/interrogate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, message })
        });
        const data = await response.json();
        
        document.getElementById(thinkingId)?.remove();

        // Reduce patience
        if (this.patience[name] && this.patience[name].val > 0) {
            this.patience[name].val -= 1;
        }

        await UI.typeLog(`${name.toUpperCase()}: "${data.response}"`, "text-white border-l-2 border-cyan-500 pl-4 bg-cyan-950/20 py-3 my-2");
        
        // If that was their last bit of patience, warn the player
        if (this.patience[name].val === 0) {
            UI.log(`WARNING: ${name.toUpperCase()} IS REACHING THEIR LIMIT.`, "text-red-500 blink font-black");
        }

        this.updateUI();
    } catch (err) {
        document.getElementById(thinkingId)?.remove();
        UI.log("SIGNAL LOST: NEURAL LINK FAILED", "text-red-500 font-black border border-red-500 p-1");
    }
},
triggerSecurityIncident(name) {
    const penalty = 120; // 2 hours lost
    this.time -= penalty;
    
    // Visual Flash
    document.body.classList.add('bg-red-900');
    setTimeout(() => document.body.classList.remove('bg-red-900'), 500);

    UI.typeLog(`[SECURITY ALERT] ${name.toUpperCase()} has summoned House Security.`, "text-red-500 font-black text-lg");
    UI.log(`PENALTY: -${penalty} MINUTES spent negotiating with the Floor Manager.`, "text-red-800 font-bold bg-white px-2");
    
    // Reset their patience slightly so you can talk again later, but at a cost
    this.patience[name].val = 2; 
    
    this.updateUI();
},

    askCurrentTarget(clue) {
    if (!this.currentTarget) {
        const dialogs = {
            "Oakhaven Diary": "DIARY ENTRY: '...I just hope Elias never finds me. I can still smell the chemicals...'",
            "Gold Lipstick": "A expensive shade of 'Sunset Gold'. There's a smudge on the cap that matches the Guard's uniform fabric.",
            "Half-Eaten Apple": "It's browning. Someone was eating this during the murder. Utterly useless for the case, but someone has bad manners.",
            "Syringe Mark": "FORENSIC NOTE: A microscopic puncture. Precision work. Not a typical medical injection."
        };
        
        UI.log(dialogs[clue] || `SELECT A SUBJECT TO SHOW THIS ${clue.toUpperCase()}.`, "text-cyan-600 italic");
        return;
    }

    // Special behavior: If showing Lipstick to the Guard or the VIP
    let customMessage = `[SHOWS EVIDENCE: ${clue.toUpperCase()}] Explain this.`;
    if (clue === "Gold Lipstick" && (this.currentTarget === "Guard" || this.currentTarget === "VIP-Arrogant")) {
        customMessage = `[CONFRONTS WITH AFFAIR EVIDENCE: ${clue.toUpperCase()}] I know about the secret meetings. Start talking.`;
    }

    this.aiTalk(this.currentTarget, customMessage);},

    recoveryHeartbeat() {
        let changed = false;
        for (let name in this.patience) {
            let char = this.patience[name];
            if (char.val < char.max) {
                char.val += 1;
                changed = true;
            }
        }
        if (changed) this.updateUI();
    },

    updateUI() {
    // 1. Update Timer Text
    const timerDisplay = document.getElementById('timer-display');
    const timeDisplayLarge = document.getElementById('time-display');
    const timeBar = document.getElementById('time-bar');

    if (timerDisplay) {
        const hours = Math.floor(this.time / 60);
        const mins = this.time % 60;
        const formatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        timerDisplay.innerText = `REMAINING: ${formatted}`;
        if (timeDisplayLarge) timeDisplayLarge.innerText = formatted;
        
        // Update the visual bar percentage (out of 1440 mins)
        if (timeBar) timeBar.style.width = `${(this.time / 1440) * 100}%`;

        if (this.time < 120) {
            timerDisplay.classList.add('text-red-500', 'blink');
            if(timeBar) timeBar.classList.replace('bg-cyan-500', 'bg-red-600');
        }
    }
        const panel = document.getElementById('character-panel');
        if (panel) {
            const currentChars = this.locations[this.currentLoc].chars;
            panel.innerHTML = currentChars.map(c => {
                const char = this.patience[c];
                if (!char) return `<div class="p-3 bg-slate-900/40 rounded animate-pulse text-xs text-slate-600 uppercase">Dossier Loading: ${c}</div>`;

                return `
                    <div onclick="GameState.selectTarget('${c}')" class="char-card p-3 rounded-lg cursor-pointer transition-all ${this.currentTarget === c ? 'bg-cyan-900/40 border border-cyan-400' : 'bg-slate-900/60 hover:bg-slate-800'}">
                        <div class="flex items-center gap-3">
                            <span class="text-xl">${char.icon}</span>
                            <div>
                                <p class="text-white text-[10px] font-black uppercase tracking-widest">${c}</p>
                                <div class="flex gap-0.5 mt-1">
                                    ${Array.from({length: char.max}).map((_, i) => `
                                        <div class="w-2 h-1 ${i < char.val ? 'bg-cyan-400 shadow-[0_0_5px_#00f3ff]' : 'bg-slate-800'} transition-all duration-500"></div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }

        const ev = document.getElementById('evidence-list');
        if (ev) {
            ev.innerHTML = this.inventory.map(i => `
                <div class="evidence-tile rounded-lg p-2 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-800/40 border border-slate-700 hover:border-cyan-500 transition-colors" 
                     onclick="GameState.askCurrentTarget('${i}')">
                    <span class="text-xl">${this.evidenceMeta[i] || '📁'}</span>
                    <span class="text-[7px] font-bold uppercase text-center text-slate-400 leading-tight">${i}</span>
                </div>`).join('');
        }

        const locLabel = document.getElementById('current-loc-label');
        if (locLabel) locLabel.innerText = `LOC: ${this.currentLoc.toUpperCase()}`;
    },

    renderMap() {
        const svg = document.getElementById('casino-map');
        if (!svg) return;
        const locs = [
            { n: "VIP Suite", x: 65, y: 10, w: 110, h: 50, icon: "♠️" },
            { n: "Bar Lounge", x: 5, y: 80, w: 110, h: 50, icon: "🍸" },
            { n: "Main Floor", x: 125, y: 80, w: 110, h: 50, icon: "🎰" }
        ];
        svg.innerHTML = locs.map(l => {
            const active = this.currentLoc === l.n;
            return `<g onclick="GameState.travel('${l.n}')" class="cursor-pointer">
                <rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="4" fill="${active ? '#00f3ff22' : '#0f172a'}" stroke="${active ? '#00f3ff' : '#1e293b'}" />
                <text x="${l.x+l.w/2}" y="${l.y+30}" text-anchor="middle" fill="white" font-size="8">${l.icon} ${l.n}</text>
            </g>`;
        }).join('');
    },

    travel(loc) {
        this.currentLoc = loc;
        this.currentTarget = null;
        this.updateUI();
        this.renderMap();
        UI.log(`RELOCATED TO ${loc.toUpperCase()}`, "text-cyan-800");
    }
};

const UI = {
    log(m, c, id = null) {
        const l = document.getElementById('game-log');
        if(!l) return;
        const p = document.createElement('p');
        if (id) p.id = id;
        p.className = c + " my-1 font-mono text-xs";
        p.innerHTML = `> ${m}`;
        l.appendChild(p);
        l.scrollTop = l.scrollHeight;
    },

    async typeLog(message, className) {
        const l = document.getElementById('game-log');
        const p = document.createElement('p');
        p.className = className + " my-2 font-mono text-xs";
        l.appendChild(p);
        for (let i = 0; i < message.length; i++) {
            p.innerHTML += message[i];
            l.scrollTop = l.scrollHeight;
            await new Promise(r => setTimeout(r, 12));
        }
    },
    // Inside UI object in script.js
async typeLogNarrative(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.innerHTML = ""; // Clear STANDBY message

    for (let i = 0; i < message.length; i++) {
        element.innerHTML += message[i];
        // Ensure the terminal scrolls as we type
        document.getElementById('end-feedback-terminal').scrollTop = document.getElementById('end-feedback-terminal').scrollHeight;
        await new Promise(r => setTimeout(r, 15)); // Narrative speed is slightly slower
    }
},

    toggleAccusation() {
        const modal = document.getElementById('accuse-modal');
        const select = document.getElementById('arrest-select');
        modal.classList.toggle('hidden');

        if (!modal.classList.contains('hidden')) {
            const suspects = Object.keys(GameState.patience);
            select.innerHTML = suspects.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('');
        }
    },

    toggleDatabase() {
        const modal = document.getElementById('database-modal');
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            document.getElementById('db-query-input').value = "";
            document.getElementById('db-results').innerHTML = "> WAITING FOR INPUT...";
            document.getElementById('db-query-input').focus();
            document.getElementById('db-query-input').onkeydown = (e) => {
                if (e.key === 'Enter') GameState.openDatabase();
            };
        }
    }
};

window.GameState = GameState;
window.UI = UI;