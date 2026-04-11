const GameState = {
    time: 1440,
    playerName: "Detective",
    currentLoc: "VIP Suite",
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    currentTarget: null,
    patience: {}, 

    locations: {
        "VIP Suite": { chars: ["Elena", "PA-Julian", "VIP-Arrogant"], clue: "Oakhaven Diary" },
        "Main Floor": { chars: ["Manager", "Guard", "VIP-Stammer"], clue: "Drug Database" },
        "Bar Lounge": { chars: ["VIP-Deaf", "PA-Viktor", "PA-Jax"], clue: "Casino Ledger" }
    },

    evidenceMeta: { 
        "Pocket Knife": "🔪", 
        "Post-Mortem Report": "📄", 
        "Syringe Mark": "💉", 
        "Oakhaven Diary": "📓", 
        "Drug Database": "💾", 
        "Casino Ledger": "📊" 
    },
    // --- CRIMINAL DATABASE LOGIC ---
openDatabase() {
    UI.log("ACCESSING CENTRAL CRIMINAL DATABASE...", "text-cyan-500 blink");
    const query = prompt("ENTER SEARCH TERM (SUBJECT NAME OR CASE ID):");
    if (!query) return;

    const term = query.toLowerCase();
    if (term.includes("sarah") || term.includes("oakhaven")) {
        UI.typeLog("MATCH FOUND: [CASE FILE #882-B]. SUBJECT: SARAH. ROLE: PARTNER IN OAKHAVEN DRUG RING. STATUS: GRANTED FULL IMMUNITY AFTER SNITCHING ON PARTNER 'ELIAS'. CURRENT LOCATION: UNKNOWN.", "text-yellow-500 bg-yellow-950/20 p-2 border border-yellow-500");
    } else {
        UI.log(`NO RECORDS FOUND FOR: ${query.toUpperCase()}`, "text-red-400");
    }
},

// --- WARRANT SYSTEM LOGIC ---
openWarrantSystem() {
    // 1. Create a list of all names currently in patience (the suspects)
    const suspectList = Object.keys(this.patience);
    if (suspectList.length === 0) {
        UI.log("DATABASE NOT INITIALIZED. CANNOT ISSUE WARRANT.", "text-red-500");
        return;
    }

    // 2. Simple UI Modal (You can replace this with a fancy HTML div later)
    const target = prompt(`ISSUE WARRANT FOR WHOM?\nOptions: ${suspectList.join(", ")}`);
    if (!target || !this.patience[target]) {
        UI.log("INVALID SUBJECT NAME.", "text-red-400");
        return;
    }

    const reason = prompt(`LIST REASONS FOR ARRESTING ${target.toUpperCase()}:`);
    if (!reason || reason.length < 10) {
        UI.log("WARRANT DENIED: INSUFFICIENT JUSTIFICATION.", "text-red-500 font-bold");
        return;
    }

    // 3. Final Result
    UI.log("TRANSMITTING WARRANT TO PRECINCT...", "text-cyan-400 animate-pulse");
    setTimeout(() => {
        UI.typeLog(`SYSTEM: WARRANT ISSUED FOR ${target.toUpperCase()}. POLICE DISPATCHED. REASON FILED: ${reason}`, "text-green-500 font-black border-2 border-green-500 p-4");
        
        // Ending Logic
        if (target.toLowerCase() === "elena") { // Assuming Elena is the killer
            UI.log("CASE CLOSED. YOU GOT THE RIGHT ONE, DETECTIVE.", "text-white bg-green-900 p-2");
        } else {
            UI.log("CASE CLOSED. THE WRONG PERSON WAS ARRESTED. CITY CHAOS INCREASES.", "text-white bg-red-900 p-2");
        }
    }, 2000);
},

    // Fixed: Added async keyword and proper method syntax
    async init() {
        this.renderMap();
        this.updateUI();

        try {
            const response = await fetch('http://localhost:5000/api/subjects');
            const subjects = await response.json();
            
            console.log("DB DATA RECEIVED:", subjects);

            if (subjects && subjects.length > 0) {
                this.patience = {};
                subjects.forEach(s => {
                    this.patience[s.name] = {
                        val: s.patienceVal || 10,
                        max: s.patienceMax || 10,
                        icon: s.icon || "👤",
                        bio: s.bio || "Classified.",
                        secret: s.secret
                    };
                });
                this.updateUI(); 
            }
        } catch (err) {
            console.error("Fetch failed:", err);
            UI.log("DATABASE OFFLINE. LOCAL RECORDS ONLY.", "text-red-500");
        }
        
        // Setup input listener once
        const input = document.getElementById('player-input');
        if (input) {
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleInput(); });
        }
        setInterval(() => this.recoveryHeartbeat(), 30000);
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
    } else if (cmd.includes("DATABASE") || cmd.includes("QUERY")) {
        this.openDatabase(); // New function
    } else if (cmd.includes("WARRANT") || cmd.includes("ARREST")) {
        this.openWarrantSystem(); // New function
    } else if (this.currentTarget) {
        this.aiTalk(this.currentTarget, raw);
    }
    input.value = "";
},

    handleSearch() {
        const clue = this.locations[this.currentLoc].clue;
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
    recoveryHeartbeat() {
    let changed = false;
    for (let name in this.patience) {
        let char = this.patience[name];
        if (char.val < char.max) {
            char.val += 1; // Recover 1 point every heartbeat
            changed = true;
        }
    }
    if (changed) this.updateUI();
},

    async aiTalk(name, message) {
    UI.log(`YOU: "${message}"`, "italic text-slate-400");
    
    // 1. Check if they have patience left before even trying to talk
    const subject = this.patience[name];
    if (subject && subject.val <= 0) {
        await UI.typeLog(`${name}: "I've said enough. Lawyer up or get out of my face."`, "text-red-500 font-bold");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/interrogate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, message })
        });
        const data = await response.json();
        
        // 2. Decrease patience after a successful response
        if (this.patience[name] && this.patience[name].val > 0) {
            this.patience[name].val -= 1; // Reduce by 1 point per query
        }

        await UI.typeLog(`${name}: "${data.response}"`, "text-white border-l-2 border-cyan-500 pl-4 bg-cyan-950/20 py-2");
        
        // 3. Refresh UI to show the bar dropping
        this.updateUI();

    } catch (err) {
        UI.log("SIGNAL LOST", "text-red-500");
    }
},

    askCurrentTarget(clue) {
        if (!this.currentTarget) {
            UI.log("SELECT A SUBJECT TO SHOW THIS EVIDENCE.", "text-cyan-600");
            return;
        }
        this.aiTalk(this.currentTarget, `Explain this: ${clue}`);
    },

    updateUI() {
        const panel = document.getElementById('character-panel');
        if (panel) {
            const currentChars = this.locations[this.currentLoc].chars;
            panel.innerHTML = currentChars.map(c => {
                const char = this.patience[c];
                if (!char) {
                    return `<div class="p-3 bg-slate-900/40 rounded animate-pulse text-[8px] text-slate-600 border border-slate-800">LOADING DOSSIER: ${c}...</div>`;
                }

                return `
                    <div onclick="GameState.selectTarget('${c}')" class="char-card p-3 rounded-lg cursor-pointer transition-all ${this.currentTarget === c ? 'bg-cyan-900/40 border border-cyan-400' : 'bg-slate-900/60 hover:bg-slate-800'}">
                        <div class="flex items-center gap-3">
                            <span class="text-xl">${char.icon}</span>
                            <div>
                                <p class="text-white text-[10px] font-black uppercase tracking-widest">${c}</p>
                                <div class="flex gap-0.5 mt-1">
                                    ${Array.from({length: char.max}).map((_, i) => `
                                        <div class="w-2 h-1 ${i < char.val ? 'bg-cyan-400 shadow-[0_0_5px_#00f3ff]' : 'bg-slate-800'}"></div>
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
        if (locLabel) {
            locLabel.innerText = `LOC: ${this.currentLoc.toUpperCase()}`;
        }
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
    log(m, c) {
        const l = document.getElementById('game-log');
        if(!l) return;
        const p = document.createElement('p');
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
            await new Promise(r => setTimeout(r, 10));
        }
    }
};

window.GameState = GameState;
window.UI = UI;