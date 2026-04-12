const GameState = {
    time: 1440,
    playerName: "Detective",
    currentLoc: "VIP Suite",
    // Starting items
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    currentTarget: null,
    patience: {}, 
    startTime: null,
    googleId: null, // Tracked from login
    playerStats: null, // Tracked from login

    evidenceMeta: { 
        "Pocket Knife": "🔪", 
        "Post-Mortem Report": "📄", 
        "Syringe Mark": "💉", 
        "Sarah's Diary": "📓", 
        "Drug Database": "💾", 
        "Casino Ledger": "📊",
        "Gold Lipstick": "💄",
        "Half-Eaten Apple": "🍎",
        "Crumpled Note": "📝"
    },

    locations: {
        "VIP Suite": { 
            chars: ["Elena Rossi", "Julian Vane", "Lady Sterling"], 
            clue: "Sarah's Diary" 
        },
        "Main Floor": { 
            chars: ["Manager Silas", "Marcus Thorne", "Arthur Penhaligon"], 
            clue: "Gold Lipstick" 
        },
        "Bar Lounge": { 
            chars: ["Judge Halloway", "Viktor Kross", "Jax Miller"], 
            clue: "Half-Eaten Apple" 
        }
    },

    async init() {
        this.renderMap();
        this.updateUI();
        this.startClock();
        this.startTime = Date.now(); // TRACK START TIME

        try {
            const response = await fetch('http://127.0.0.1:8080/api/subjects');
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

    startClock() {
        if (this.gameClockInterval) clearInterval(this.gameClockInterval);
        this.gameClockInterval = setInterval(() => {
            this.time -= 1;
            this.updateUI();
            if (this.time <= 0) {
                this.gameOver("LOSS", "TIME EXPIRED: The killer has escaped the city.");
            }
        }, 1000); 
    },

    gameOver(type, narrative) {
        if (this.gameClockInterval) clearInterval(this.gameClockInterval);
        document.getElementById('player-input').disabled = true;

        const endData = {
            WIN: {
                header: "CASE_CLOSED",
                headerClass: "neon-text-green", 
                image: "https://t4.ftcdn.net/jpg/04/39/31/31/360_F_439313135_MiYN3R98rCRl38t1NFNICJYs7rs55dqH.jpg"
            },
            LOSS: {
                header: "STATUS_TERMINATED",
                headerClass: "neon-text-red", 
                image: "https://www.sydneycriminallawyers.com.au/app/uploads/2015/02/prison-escape-night.jpg"
            }
        };

        const data = endData[type] || endData.LOSS;
        const screen = document.getElementById('end-screen');
        const header = document.getElementById('end-status-header');
        const img = document.getElementById('end-image');

        if (screen && header && img) {
            header.innerText = data.header;
            header.className = data.headerClass;
            img.src = data.image;
            screen.classList.remove('hidden');
            setTimeout(() => {
                UI.typeLogNarrative("end-ai-feedback", narrative);
            }, 1500);
        }

        // --- STATS SYNC LOGIC ---
        const secondsPlayed = Math.floor((Date.now() - this.startTime) / 1000);

        if (this.googleId) {
            fetch('http://127.0.0.1:8080/api/update-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    googleId: this.googleId,
                    result: type === "WIN" ? "wins" : "losses",
                    timeSpent: secondsPlayed
                })
            }).then(r => r.json()).then(updated => {
                console.log("Stats Recorded:", updated);
            });
        }
    }, 

    openDatabase() {
        const input = document.getElementById('db-query-input');
        const display = document.getElementById('db-results');
        
        if (!input || !display) {
            console.error("Critical UI elements missing for database.");
            return;
        }

        const query = input.value.trim().toLowerCase();
        console.log("Database Query Received:", query); // Check your console (F12) for this!

        if (!query) {
            display.innerHTML = `<p class="text-slate-500">> ENTER QUERY TO SEARCH...</p>`;
            return;
        }

        display.innerHTML = `<p class="animate-pulse text-cyan-700">> SEARCHING ARCHIVES...</p>`;

        setTimeout(() => {
            // We use .includes() to make it more flexible
            if (query.includes("sarah") || query.includes("oakhaven") || query.includes("elias")) {
                display.innerHTML = `
                    <div class="border border-yellow-500/50 p-3 bg-yellow-950/20 rounded mb-2 animate-in fade-in duration-500">
                        <p class="text-yellow-500 font-bold">[FILE FOUND: OAKHAVEN_2021]</p>
                        <p class="text-white"><span class="text-cyan-500 font-bold">SUBJECT:</span> Sarah [DECEASED]</p>
                        <p class="text-white"><span class="text-cyan-500 font-bold">RECORD:</span> Former associate of the Oakhaven Drug Ring.</p>
                        <p class="text-white"><span class="text-cyan-500 font-bold">INTEL:</span> Provided state evidence against lead chemist. Was granted full immunity <span class="text-red-500 font-bold">'ELIAS'</span>.</p>
                        <p class="text-xs text-slate-500 mt-2 italic">Note: Elias is suspected to have undergone facial reconstruction. Sarah has a restraining order against him.</p>
                    </div>`;
            } else {
                display.innerHTML = `<p class="text-red-500 uppercase font-bold">> NO DATA MATCHES FOR: ${query.toUpperCase()}</p>
                                     <p class="text-[10px] text-slate-600 mt-1">Try: 'Sarah', 'Elias', or 'Oakhaven'</p>`;
            }
        }, 800);
    },

    async submitFinalTheory() {
        const target = document.getElementById('arrest-select').value;
        const theory = document.getElementById('theory-input').value;

        if (theory.length < 20) {
            UI.log("THEORY TOO BRIEF. HIGH-COMMAND WILL REJECT THIS.", "text-red-500");
            return;
        }

        UI.toggleAccusation();
        UI.log(`TRANSMITTING WARRANT FOR ${target.toUpperCase()}...`, "text-yellow-500 blink");

        try {
            const response = await fetch('http://127.0.0.1:8080/api/verify-warrant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, theory })
            });
            const result = await response.json();
            this.gameOver(result.success ? "WIN" : "LOSS", result.feedback);
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
        const currentClue = this.locations[this.currentLoc].clue;
        if (currentClue && !this.inventory.includes(currentClue)) {
            this.inventory.push(currentClue);
            this.time -= 10;
            UI.log(`INTEL RECOVERED: ${currentClue.toUpperCase()} (-10 MINS)`, "text-yellow-400 font-bold");
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
            this.triggerSecurityIncident(name);
            return;
        }

        const thinkingId = `think-${Date.now()}`;
        UI.log(`${name.toUpperCase()} IS RESPONDING...`, "text-cyan-900 animate-pulse text-[8px]", thinkingId);

        try {
            const response = await fetch('http://127.0.0.1:8080/api/interrogate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, message })
            });
            const data = await response.json();
            document.getElementById(thinkingId)?.remove();

            if (this.patience[name]?.val > 0) this.patience[name].val -= 1;

            await UI.typeLog(`${name.toUpperCase()}: "${data.response}"`, "text-white border-l-2 border-cyan-500 pl-4 bg-cyan-950/20 py-3 my-2");
            
            if (this.patience[name].val === 0) {
                UI.log(`WARNING: ${name.toUpperCase()} IS REACHING THEIR LIMIT.`, "text-red-500 blink font-black");
            }
            this.updateUI();
        } catch (err) {
            document.getElementById(thinkingId)?.remove();
            UI.log("SIGNAL LOST: NEURAL LINK FAILED", "text-red-500 font-black");
        }
    },

    triggerSecurityIncident(name) {
        this.time -= 120;
        document.body.classList.add('bg-red-900');
        setTimeout(() => document.body.classList.remove('bg-red-900'), 500);
        UI.typeLog(`[SECURITY ALERT] ${name.toUpperCase()} summoned Security.`, "text-red-500 font-black");
        this.patience[name].val = 2; 
        this.updateUI();
    },

    askCurrentTarget(clue) {
        if (!this.currentTarget) {
            const dialogs = {
                "Sarah's Diary": "DIARY ENTRY: '...I just hope Elias never finds me. I can still smell the chemicals...'",
                "Gold Lipstick": "An expensive shade of 'Sunset Gold'. There's a smudge on the cap...",
                "Half-Eaten Apple": "It's browning. Someone was eating this during the murder.",
                "Syringe Mark": "FORENSIC NOTE: A microscopic puncture. Precision work."
            };
            UI.log(dialogs[clue] || `SELECT A SUBJECT TO SHOW THIS ${clue.toUpperCase()}.`, "text-cyan-600 italic");
            return;
        }
        const message = `[PRESENTS EVIDENCE: ${clue.toUpperCase()}] I found this in the suite. What can you tell me about it?`;
        UI.log(`YOU: (Showing ${clue.toUpperCase()} to ${this.currentTarget})`, "italic text-slate-400 font-bold");
        this.aiTalk(this.currentTarget, message);
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
        const timerDisplay = document.getElementById('timer-display');
        const timeDisplayLarge = document.getElementById('time-display');
        const timeBar = document.getElementById('time-bar');

        if (timerDisplay) {
            const hours = Math.floor(this.time / 60);
            const mins = this.time % 60;
            const formatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
            timerDisplay.innerText = `REMAINING: ${formatted}`;
            if (timeDisplayLarge) timeDisplayLarge.innerText = formatted;
            if (timeBar) timeBar.style.width = `${(this.time / 1440) * 100}%`;
        }

        const panel = document.getElementById('character-panel');
        if (panel) {
            const currentChars = this.locations[this.currentLoc].chars;
            panel.innerHTML = currentChars.map(c => {
                const char = this.patience[c];
                if (!char) return `<div class="p-3 bg-slate-900/40 animate-pulse text-xs">Loading Dossier...</div>`;
                return `
                    <div onclick="GameState.selectTarget('${c}')" class="group relative char-card p-3 rounded-lg ${this.currentTarget === c ? 'bg-cyan-900/40 border border-cyan-400' : 'bg-slate-900/60'} w-full">
                        <div class="absolute left-0 lg:left-full lg:ml-4 top-full lg:top-0 w-full lg:w-64 p-4 bg-slate-950 border-2 border-cyan-500 rounded-lg opacity-0 group-hover:opacity-100 z-[9999] pointer-events-none transition-all">
                            <h3 class="text-cyan-400 font-black text-[10px] uppercase">${c}</h3>
                            <p class="text-white text-[10px] italic mt-2">"${char.bio}"</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${char.icon}</span>
                            <div class="flex-1">
                                <p class="text-white text-[10px] font-black uppercase">${c}</p>
                                <div class="flex gap-0.5 mt-1 w-full max-w-[100px]">
                                    ${Array.from({length: char.max}).map((_, i) => `<div class="flex-1 h-1 ${i < char.val ? 'bg-cyan-400' : 'bg-slate-800'}"></div>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }

        const ev = document.getElementById('evidence-list');
        if (ev) { 
            ev.innerHTML = this.inventory.map(i => `
                <div class="evidence-tile rounded-lg p-2 flex flex-col items-center bg-slate-800/40 border border-slate-700 hover:border-cyan-500 cursor-pointer min-w-[60px]" 
                     onclick="GameState.askCurrentTarget(\`${i}\`)"> <span class="text-xl">${this.evidenceMeta[i] || '📁'}</span>
                    <span class="text-[7px] font-bold uppercase text-slate-400 text-center">${i}</span>
                </div>`).join('');
        }

        const locLabel = document.getElementById('current-loc-label');
        if (locLabel) locLabel.innerText = `LOC: ${this.currentLoc.toUpperCase()}`;
    },

    renderMap() {
        const svg = document.getElementById('casino-map');
        if (!svg) return;

        svg.setAttribute("viewBox", "0 0 240 140");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "auto";

        const locs = [
            { n: "VIP Suite", x: 65, y: 10, w: 110, h: 50, icon: "♠️" },
            { n: "Bar Lounge", x: 5, y: 80, w: 110, h: 50, icon: "🍸" },
            { n: "Main Floor", x: 125, y: 80, w: 110, h: 50, icon: "🎰" }
        ];
        svg.innerHTML = locs.map(l => {
            const active = this.currentLoc === l.n;
            return `<g onclick="GameState.travel('${l.n}')" class="cursor-pointer">
                <rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="4" fill="${active ? '#00f3ff22' : '#0f172a'}" stroke="${active ? '#00f3ff' : '#1e293b'}" />
                <text x="${l.x+l.w/2}" y="${l.y+30}" text-anchor="middle" fill="white" font-size="8" font-family="monospace">${l.icon} ${l.n}</text>
            </g>`;
        }).join('');
    },

    travel(loc) {
        if (this.currentLoc === loc) return;
        this.time -= 15;
        this.currentLoc = loc;
        this.currentTarget = null;
        this.updateUI();
        this.renderMap();
        UI.log(`RELOCATED TO ${loc.toUpperCase()}. (-15 MINS TRAVEL)`, "text-red-400 italic");
        if (this.time <= 0) this.gameOver("LOSS", "Time expired during travel.");
    }
};

// --- GOOGLE LOGIN HANDLER (OUTSIDE OBJECT) ---
async function handleGoogleLogin(response) {
    // Note: You need a helper to decode the JWT (like jwt-decode library or a simple split)
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));

    const res = await fetch('http://127.0.0.1:8080/api/user-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            googleId: payload.sub,
            displayName: payload.name,
            email: payload.email,
            avatar: payload.picture
        })
    });

    const user = await res.json();
    document.getElementById('stat-name').innerText = user.displayName;
document.getElementById('stat-wins').innerText = user.stats.wins;
document.getElementById('stat-losses').innerText = user.stats.losses;
const avatar = document.getElementById('player-avatar');
avatar.src = user.avatar;
avatar.classList.remove('hidden');
    
    // Store in GameState
    GameState.googleId = user.googleId;
    GameState.playerStats = user.stats; 
    
    console.log("Logged in as:", user.displayName);
    UI.log(`WELCOME BACK, DETECTIVE ${user.displayName.toUpperCase()}`, "text-cyan-400 font-bold");
    
    // Update basic UI stats if elements exist
    if(document.getElementById('stat-name')) document.getElementById('stat-name').innerText = user.displayName;
}

const UI = {
    log(m, c, id = null) {
        const l = document.getElementById('game-log');
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
    async typeLogNarrative(elementId, message) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.innerHTML = "";
        for (let i = 0; i < message.length; i++) {
            element.innerHTML += message[i];
            const feedbackTerminal = document.getElementById('end-feedback-terminal');
            if(feedbackTerminal) feedbackTerminal.scrollTop = feedbackTerminal.scrollHeight;
            await new Promise(r => setTimeout(r, 15));
        }
    },
    toggleAccusation() {
        const modal = document.getElementById('accuse-modal');
        const select = document.getElementById('arrest-select');
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            const suspects = Object.keys(GameState.patience).sort(() => Math.random() - 0.5);
            select.innerHTML = suspects.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('');
            select.selectedIndex = 0; 
        }
    },
    toggleDatabase() {
        const modal = document.getElementById('database-modal');
        modal.classList.toggle('hidden');
    }
};

window.GameState = GameState;
window.UI = UI;
window.handleGoogleLogin = handleGoogleLogin;