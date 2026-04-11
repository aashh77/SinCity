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

    async init() {
        this.renderMap();
        this.startClock();
        this.updateUI();

        try {
            const response = await fetch('http://localhost:5000/api/subjects');
            const subjects = await response.json();
            
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
        
        const input = document.getElementById('player-input');
        if (input) {
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleInput(); });
        }
        setInterval(() => this.recoveryHeartbeat(), 90000);
    },
    // Inside GameState object
startClock() {
    setInterval(() => {
        this.time -= 1; // Drop 1 minute
        this.updateUI();

        // CHECK FOR GAME OVER
        if (this.time <= 0) {
            this.gameOver("TIME EXPIRED: The killer has escaped the city. You failed.");
        }
    }, 1000); // 1000ms = 1 real second equals 1 in-game minute
},

gameOver(reason) {
    // 1. Stop the clock
    clearInterval(this.gameClockInterval);
    
    // 2. Disable input so they can't keep playing
    const input = document.getElementById('player-input');
    if (input) {
        input.disabled = true;
        input.placeholder = "CASE TERMINATED.";
    }

    // 3. Visual Lockdown
    document.body.style.filter = "grayscale(100%) brightness(50%)";
    UI.typeLog(`SYSTEM STATUS: ${reason}`, "text-white font-bold text-center text-xl block mt-10");
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
async submitFinalTheory() {
    const target = document.getElementById('arrest-select').value;
    const theory = document.getElementById('theory-input').value;

    if (theory.length < 20) {
        UI.log("THEORY TOO BRIEF. HIGH-COMMAND WILL REJECT THIS.", "text-red-500");
        return;
    }

    // Close modal and show loading
    UI.toggleAccusation();
    UI.log(`TRANSMITTING WARRANT FOR ${target.toUpperCase()} TO HIGH-COMMAND...`, "text-yellow-500 blink");

    try {
        const response = await fetch('http://localhost:5000/api/verify-warrant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, theory })
        });

        const result = await response.json();

        // Reveal the result with a typing effect
        if (result.success) {
            await UI.typeLog(`[SUCCESS] ${result.feedback}`, "text-green-400 font-black border-2 border-green-500 p-4 bg-green-950/40 mt-4");
            // End game
            this.gameOver("CASE CLOSED. JUSTICE SERVED.");
        } else {
            await UI.typeLog(`[FAILURE] ${result.feedback}`, "text-red-500 font-black border-2 border-red-500 p-4 bg-red-950/40 mt-4");
            // Optionally: deduct massive time for a wrong warrant
            this.time -= 300; 
            UI.log("-300 MINUTES: BUREAUCRATIC PENALTY FOR WRONGFUL ACCUSATION.", "text-red-800");
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
        if (subject && subject.val <= 0) {
            await UI.typeLog(`${name}: "I've said enough. Talk to my lawyer."`, "text-red-500 font-bold");
            return;
        }

        const thinkingId = `think-${Date.now()}`;
        UI.log(`${name.toUpperCase()} IS RESPONDING...`, "text-cyan-900 animate-pulse text-[8px] tracking-[0.2em]", thinkingId);

        try {
            const response = await fetch('http://localhost:5000/api/interrogate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, message })
            });
            const data = await response.json();
            
            const thinkNode = document.getElementById(thinkingId);
            if (thinkNode) thinkNode.remove();

            if (this.patience[name] && this.patience[name].val > 0) {
                this.patience[name].val -= 1;
            }

            await UI.typeLog(`${name.toUpperCase()}: "${data.response}"`, "text-white border-l-2 border-cyan-500 pl-4 bg-cyan-950/20 py-3 my-2");
            this.updateUI();
        } catch (err) {
            const thinkNode = document.getElementById(thinkingId);
            if (thinkNode) thinkNode.remove();
            UI.log("SIGNAL LOST: NEURAL LINK FAILED", "text-red-500 font-black border border-red-500 p-1");
        }
    },

    askCurrentTarget(clue) {
        if (!this.currentTarget) {
            if (clue === "Oakhaven Diary") {
                UI.log("DIARY ENTRY: 'Finally out of Oakhaven. New life, new name. I just hope Elias never finds me. I can still smell the chemicals from his lab...'", "text-yellow-200 italic p-3 border-l-2 border-yellow-500 bg-yellow-950/20");
            } else {
                UI.log("SELECT A SUBJECT TO SHOW THIS EVIDENCE.", "text-cyan-600 uppercase text-[10px]");
            }
            return;
        }
        this.aiTalk(this.currentTarget, `[SHOWS EVIDENCE: ${clue.toUpperCase()}] Explain this.`);
    },

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
        const timer = document.getElementById('timer-display');
if (timer) {
    const hours = Math.floor(this.time / 60);
    const mins = this.time % 60;
    // Formats it to 00:00 style
    timer.innerText = `TIME REMAINING: ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    // Visual warning when time is low
    if (this.time < 120) { // Less than 2 hours left
        timer.classList.add('text-red-500', 'blink');
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