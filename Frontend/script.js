const GameState = {
    time: 1440,
    playerName: "Detective",
    currentLoc: "VIP Suite",
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    currentTarget: null,
    patience: {}, 
    startTime: null,
    googleId: null,
    playerStats: null,

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
        this.renderClipboard();
        this.startTime = Date.now(); 
        if (window.PhoneSystem) {
            window.PhoneSystem.init();
        }
        //if (window.AudioManager) {
        AudioManager.init();
        //AudioManager.playMusic();
    //}
    CheatCodes.init();

        try {
            const response = await fetch('https://sin-city.onrender.com/api/subjects');
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
                const suspects = [
    "Elena", "PA-Julian", "VIP-Arrogant", 
    "Manager", "Guard", "VIP-Stammer", 
    "VIP-Deaf", "PA-Viktor", "PA-Jax"
];
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


        const secondsPlayed = Math.floor((Date.now() - this.startTime) / 1000);

        if (this.googleId) {
            fetch('https://sin-city.onrender.com/api/update-stats', {
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
        console.log("Database Query Received:", query);

        if (!query) {
            display.innerHTML = `<p class="text-slate-500">> ENTER QUERY TO SEARCH...</p>`;
            return;
        }

        display.innerHTML = `<p class="animate-pulse text-cyan-700">> SEARCHING ARCHIVES...</p>`;

        setTimeout(() => {
            
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
            const response = await fetch('https://sin-city.onrender.com/api/verify-warrant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, theory })
            });
            const result = await response.json();
            window.lastGameOutcome = result.success ? 'perfect' : 'fail';
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
            const response = await fetch('https://sin-city.onrender.com/api/interrogate', {
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
        const timerBar = document.getElementById('timer-bar');

        const TOTAL_START_TIME = 1440; 

    if (timeDisplayLarge) {
        const hours = Math.floor(this.time / 60);
        const mins = this.time % 60;
        const formatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        timeDisplayLarge.innerText = formatted;
        
        // --- TIMER BAR LOGIC ---
        if (timerBar) {
            const percentage = (this.time / TOTAL_START_TIME) * 100;
            timerBar.style.width = `${percentage}%`;

            // Remove existing color classes first
            timerBar.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'shadow-[0_0_15px_#22c55e]', 'shadow-[0_0_15px_#eab308]', 'shadow-[0_0_15px_#ef4444]');

            // Color logic based on 8-hour blocks (480 mins each)
            if (this.time > 960) { 
                // First 8 hours (24:00 down to 16:00)
                timerBar.classList.add('bg-green-500', 'shadow-[0_0_15px_#22c55e]');
            } else if (this.time > 480) { 
                // Middle 8 hours (16:00 down to 08:00)
                timerBar.classList.add('bg-yellow-500', 'shadow-[0_0_15px_#eab308]');
            } else { 
                // Final 8 hours (08:00 down to 00:00)
                timerBar.classList.add('bg-red-500', 'shadow-[0_0_15px_#ef4444]');
                timeDisplayLarge.classList.add('text-red-500', 'animate-pulse');
            }
        }
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
        UI.log(`RELOCATED TO ${loc.toUpperCase()}. (-15 MINS TRAVEL). The air smells of luxury.`, "text-red-400 italic");
        if (this.time <= 0) this.gameOver("LOSS", "Time expired during travel.");
    },

    // ... (previous GameState code)
    travel(loc) {
        if (this.currentLoc === loc) return;
        this.time -= 15;
        this.currentLoc = loc;
        this.currentTarget = null;
        this.updateUI();
        this.renderMap();
        UI.log(`RELOCATED TO ${loc.toUpperCase()}. (-15 MINS TRAVEL). The air smells of luxury.`, "text-red-400 italic");
        if (this.time <= 0) this.gameOver("LOSS", "Time expired during travel.");
    }, // Add a comma here if there isn't one

    // --- ADD THIS NEW METHOD TO GAMESTATE ---
    renderClipboard() {
    const suspectsList = [
        "Elena Rossi", "Julian Vane", "Lady Sterling", 
        "Manager Silas", "Marcus Thorne", "Arthur Penhaligon", 
        "Judge Halloway", "Viktor Kross", "Jax Miller"
    ];
    const grid = document.getElementById('clipboard-grid');
    if (!grid) return;

    grid.innerHTML = suspectsList.map(s => `
        <div onclick="this.classList.toggle('line-through')" 
             class="group cursor-pointer flex items-center gap-2 text-[10px] text-[#92400e] font-bold py-0.5 select-none transition-all">
            <span class="w-3 h-3 border border-[#d97706]/50 flex-shrink-0 flex items-center justify-center text-[8px] group-[.line-through]:bg-red-900 group-[.line-through]:text-white">
                ✕
            </span>
            ${s.toUpperCase()}
        </div>
    `).join('');
}
};

const AudioManager = {
    init() {
        const music = document.getElementById('bg-music');
        const slider = document.getElementById('volume-slider');
        
        if (!music || !slider) return;

        const savedVol = localStorage.getItem('sincity_vol') || 0.5;
        music.volume = savedVol;
        slider.value = savedVol;

        slider.oninput = (e) => {
            const val = e.target.value;
            music.volume = val;
            localStorage.setItem('sincity_vol', val);
            
            // If they move the slider but music was blocked, try starting it
            if (music.paused && val > 0) this.play();
        };

        // Important: Try to play immediately
        this.play();
    },

    play() {
        const music = document.getElementById('bg-music');
        if (!music) return;

        // Force a load and attempt play
        music.play().then(() => {
            console.log("🔊 Noir audio active.");
        }).catch(err => {
            console.warn("🔇 Autoplay blocked. Will trigger on next click.");
            
            // FALLBACK: One-time listener for the first click anywhere
            const startOnInteraction = () => {
                music.play();
                document.removeEventListener('click', startOnInteraction);
            };
            document.addEventListener('click', startOnInteraction);
        });
    }
};
const CheatCodes = {
    // Hardcoded suspect to be removed
    TARGET_SUSPECT: "Jax", 

    init() {
        const input = document.getElementById('cheat-input');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const code = input.value.trim().toLowerCase();
                this.execute(code);
                input.value = ""; // Clear after attempt
            }
        });
    },

    execute(code) {
        // CODE 1: Increase Time by 15 mins (MAX 24 HOURS)
        if (code === "marinatesnow") {
            const currentTotalSeconds = GameState.time * 60;
            const fifteenMins = 15 * 60;
            const maxSeconds = 24 * 60 * 60;

            if (currentTotalSeconds + fifteenMins <= maxSeconds) {
                GameState.time += 15;
            } else {
                GameState.time = 24 * 60; // Cap it at 24 hours
            }
            
            GameState.updateUI();
            UI.log("OVERRIDE: TEMPORAL MATRIX RECALIBRATED (+15M)", "text-yellow-500 font-bold");
        }

        // CODE 2: Strike through Jax
        if (code === "NOPESTS!!") {
            this.strikeSuspect(this.TARGET_SUSPECT);
            UI.log(`OVERRIDE: SUBJECT ${this.TARGET_SUSPECT.toUpperCase()} REMOVED FROM SCOPE`, "text-red-500 font-bold");
        }
    },

    strikeSuspect(name) {
    // Get all the suspect divs inside the clipboard grid
    const grid = document.getElementById('clipboard-grid');
    if (!grid) return;

    const suspects = grid.querySelectorAll('div');
    
    suspects.forEach(el => {
        // We check if the text matches (ignoring case)
        if (el.innerText.toUpperCase().includes(name.toUpperCase())) {
            // Apply your manual toggle class
            el.classList.add('line-through'); 
            
            // Also apply the "Struck Out" CSS for the neon red line effect
            el.classList.add('struck-out');
            
            // Optional: Disable the click so the user can't un-strike him
            el.style.pointerEvents = 'none';
        }
    });
}};

// Initialize inside GameState.init()
// CheatCodes.init();

// Trigger this in handleGameStart()

// --- GOOGLE LOGIN HANDLER (OUTSIDE OBJECT) ---
async function handleGoogleLogin(response) {
    
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));

    const res = await fetch('https://sin-city.onrender.com/api/user-sync', {
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
    
   
    GameState.googleId = user.googleId;
    GameState.playerStats = user.stats; 
    
    console.log("Logged in as:", user.displayName);
    UI.log(`WELCOME BACK, DETECTIVE ${user.displayName.toUpperCase()}`, "text-cyan-400 font-bold");
    
    
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

        setTimeout(() => {
        const btn = document.getElementById('claim-rewards-btn');
        if(btn) btn.classList.remove('hidden');
    }, 500);
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
    },

    toggleRules() {
        const modal = document.getElementById('rules-modal');
        if (modal) {
            modal.classList.toggle('hidden');
        }
    }
};
const PhoneSystem = {
    contacts: {
        wife: { name: "Maya (Wife)", messages: ["Stay safe out there!", "Don't overwork yourself, yeah?"] },
        boss: { name: "Chief Miller (Boss)", messages: ["WHERE IS THE DAMN REPORT?", "Close the case fast! Useless!"] },
        colleague: { name: "Dave (Partner)", messages: ["Uncle #5 just passed away.", "Another funeral... crazyyyy, right?"] },
        spam: { name: "WIN_FREE_CREDITS", messages: ["CONGRATS! YOU WON A NEW HOVER-CAR!", "CLICK HERE TO CLAIM"] }
    },

    hints: [
        "SECRET INTEL: Someone is lying. About everything. How do we find their real identity?",
        "SECRET INTEL: A shock? That's a weird way to trigger a heart attack with no previous heart ailments. "
        
    ],

    init() {
        if (document.getElementById('phone-icon')) return;

        const btn = document.createElement('div');
        btn.id = 'phone-icon';
        btn.className = 'fixed bottom-8 left-8 w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center cursor-pointer shadow-[0_0_30px_#00f3ff] z-[4000] hover:scale-110 transition-all text-4xl border-4 border-white/20';
        btn.innerHTML = '📱';
        btn.onclick = () => this.togglePhone();
        document.body.appendChild(btn);

        const modal = document.createElement('div');
        modal.id = 'phone-modal';
        modal.className = 'hidden fixed bottom-32 left-8 w-80 h-[600px] bg-slate-950 border-2 border-cyan-500/50 rounded-[3rem] z-[4000] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,243,255,0.2)] font-mono border-t-[14px] border-x-[8px] border-b-[14px] border-slate-900';
        modal.innerHTML = `
            <div class="h-6 w-32 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-[4001]"></div>
            <div class="bg-slate-950 p-6 pt-10 flex justify-between items-center border-b border-cyan-500/20">
                <button id="phone-back-btn" class="invisible text-cyan-500 text-[10px] font-black" onclick="PhoneSystem.showHomeScreen()"> < EXIT </button>
                <span id="phone-header-title" class="text-cyan-400 font-black text-[10px] tracking-widest">SINCITY_OS</span>
                <span class="text-cyan-400 text-[8px] opacity-50">5G</span>
            </div>
            <div id="phone-content" class="flex-grow overflow-y-auto p-4 bg-slate-950"></div>
            <div id="phone-input-area" class="hidden p-4 bg-slate-900/80 backdrop-blur-md border-t border-cyan-500/10">
                <div class="flex gap-2">
                    <input type="text" id="phone-user-input" placeholder="Message..." class="flex-grow bg-black border border-cyan-500/30 p-2 text-[10px] text-cyan-400 outline-none rounded">
                    <button onclick="PhoneSystem.sendMessage()" class="bg-cyan-500 text-black px-3 py-1 text-[10px] font-black rounded">SEND</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // --- FIXED ENTER KEY LOGIC ---
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const phoneInput = document.getElementById('phone-user-input');
                
                if (document.activeElement === phoneInput) {
                    this.sendMessage();
                }
            }
        });

        this.showHomeScreen();
    },

    togglePhone() {
        const modal = document.getElementById('phone-modal');
        modal.classList.toggle('hidden');
    },

    showHomeScreen() {
        this.activeContactKey = null;
        document.getElementById('phone-back-btn').classList.add('invisible');
        document.getElementById('phone-input-area').classList.add('hidden');
        document.getElementById('phone-header-title').innerText = "HOME";
        const container = document.getElementById('phone-content');
        container.innerHTML = `
            <div class="flex flex-col gap-6 p-4 mt-10">
                <div onclick="PhoneSystem.showContactList()" class="flex items-center gap-4 p-5 bg-slate-900/50 border border-cyan-500/20 rounded-2xl cursor-pointer hover:bg-cyan-500/10 group">
                    <div class="w-14 h-14 bg-cyan-500 rounded-xl flex items-center justify-center text-3xl shadow-[0_0_15px_#00f3ff]">💬</div>
                    <div>
                        <p class="text-white font-black text-xs">MESSAGES</p>
                        <p class="text-cyan-700 text-[8px]">ENCRYPTED CHATS</p>
                    </div>
                </div>
                <div onclick="PhoneSystem.openGame()" class="flex items-center gap-4 p-5 bg-slate-900/50 border border-yellow-500/20 rounded-2xl cursor-pointer hover:bg-yellow-500/10 group">
                    <div class="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center text-3xl shadow-[0_0_15px_#eab308]">🎲</div>
                    <div>
                        <p class="text-white font-black text-xs">7 UP 7 DOWN</p>
                        <p class="text-yellow-700 text-[8px]">UNDERGROUND CASINO</p>
                    </div>
                </div>
            </div>
        `;
    },

    showContactList() {
        document.getElementById('phone-back-btn').classList.remove('invisible');
        document.getElementById('phone-header-title').innerText = "CHATS";
        const container = document.getElementById('phone-content');
        container.innerHTML = Object.keys(this.contacts).map(key => `
            <div onclick="PhoneSystem.openChat('${key}')" class="p-4 mb-3 bg-slate-900/80 border-l-4 border-cyan-500 rounded-r-lg cursor-pointer">
                <p class="text-cyan-400 font-black text-xs uppercase">${this.contacts[key].name}</p>
                <p class="text-[9px] text-slate-500 truncate">${this.contacts[key].messages[this.contacts[key].messages.length-1]}</p>
            </div>
        `).join('');
    },

    openGame() {
    document.getElementById('phone-back-btn').classList.remove('invisible');
    document.getElementById('phone-header-title').innerText = "CASINO";
    const container = document.getElementById('phone-content');
    container.innerHTML = `
        <div class="flex flex-col items-center p-2">
            <div class="w-full text-center py-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30 mb-2">
                <p class="text-yellow-500 font-black text-[10px] tracking-widest uppercase">Roll the Bones</p>
            </div>
            
            <div class="mb-6 text-center">
                <p class="text-[9px] text-cyan-500/70 font-bold italic tracking-tighter">
                    "RISK YOUR TIME. WIN THE INTEL."
                </p>
                <div class="w-16 h-[1px] bg-cyan-900 mx-auto mt-1"></div>
            </div>

            <div class="flex gap-6 mb-12">
                <div id="die1" class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl text-black shadow-[0_10px_0_#cbd5e1] font-black border-2 border-slate-300">?</div>
                <div id="die2" class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl text-black shadow-[0_10px_0_#cbd5e1] font-black border-2 border-slate-300">?</div>
            </div>
            <div class="grid w-full gap-3">
                <button onclick="PhoneSystem.playGame('down')" class="game-btn border-2 border-blue-500 p-3 text-blue-500 text-[10px] font-black rounded-lg uppercase hover:bg-blue-500/10 transition-colors">7 Down (2-6)</button>
                <button onclick="PhoneSystem.playGame('seven')" class="game-btn border-2 border-yellow-500 p-3 text-yellow-500 text-[10px] font-black rounded-lg uppercase hover:bg-yellow-500/10 transition-colors">Lucky 7</button>
                <button onclick="PhoneSystem.playGame('up')" class="game-btn border-2 border-green-500 p-3 text-green-500 text-[10px] font-black rounded-lg uppercase hover:bg-green-500/10 transition-colors">7 Up (8-12)</button>
            </div>
            <div id="game-status" class="mt-8 text-[10px] text-center font-bold h-10 tracking-widest uppercase"></div>
        </div>
    `;
},

    playGame(choice) {
        const d1 = document.getElementById('die1');
        const d2 = document.getElementById('die2');
        const status = document.getElementById('game-status');
        const btns = document.querySelectorAll('.game-btn');
        btns.forEach(b => b.disabled = true);
        
        status.innerHTML = `<span class="text-cyan-400 animate-pulse">ROLLING...</span>`;
        let count = 0;
        const roll = setInterval(() => {
            d1.innerText = Math.floor(Math.random()*6)+1;
            d2.innerText = Math.floor(Math.random()*6)+1;
            d1.style.transform = `rotate(${Math.random()*10-5}deg)`;
            d2.style.transform = `rotate(${Math.random()*10-5}deg)`;
            count++;
            if(count > 15) {
                clearInterval(roll);
                this.finishGame(choice, d1, d2, status, btns);
            }
        }, 80);
    },

    finishGame(choice, d1, d2, status, btns) {
        const win = Math.random() < 0.30;
        let r1, r2;
        
        if (win) {
            // Pick winning dice
            if (choice === 'down') { r1=1; r2=2; } 
            else if (choice === 'up') { r1=5; r2=5; } 
            else { r1=3; r2=4; }
            
            const retrievedIntel = this.hints[Math.floor(Math.random()*this.hints.length)];
            status.innerHTML = `<span class="text-green-500 uppercase">INTEL DECRYPTED!</span>`;
            
            // --- 1. Push to Phone Chat (for history) ---
            this.contacts.boss.messages.push(`[ENCRYPTED LEAK]: ${retrievedIntel}`);
            
            const cleanClue = retrievedIntel.replace("SECRET INTEL: ", "");
            UI.log(`DECRYPTED INTEL: ${cleanClue.toUpperCase()}`, "text-green-400 font-bold border-y border-green-900/50 py-2");
            
        } else {
            // Pick losing dice
            if (choice === 'down') { r1=5; r2=6; } else { r1=1; r2=2; }
            
            // --- 3. Increased Penalty to 20 mins ---
            GameState.time -= 20; 
            GameState.updateUI();
            
            status.innerHTML = `<span class="text-red-500 uppercase">LOST. -20 MINS</span>`;
            UI.log("CASINO LOSS: TIME PENALTY APPLIED (-20 MINS)", "text-red-600");
        }
        
        d1.innerText = r1; 
        d2.innerText = r2;
        d1.style.transform = d2.style.transform = 'none';
        setTimeout(() => btns.forEach(b => b.disabled = false), 1000);
    },

    openChat(key) {
        this.activeContactKey = key;
        document.getElementById('phone-back-btn').classList.remove('invisible');
        document.getElementById('phone-input-area').classList.remove('hidden');
        document.getElementById('phone-header-title').innerText = this.contacts[key].name.toUpperCase();
        this.renderMessages();
    },

    renderMessages() {
        const contact = this.contacts[this.activeContactKey];
        const container = document.getElementById('phone-content');
        container.innerHTML = contact.messages.map(msg => {
            const isPlayer = msg.startsWith("YOU:");
            return `<div class="mb-4 flex ${isPlayer ? 'justify-end' : 'justify-start'}">
                <div class="${isPlayer ? 'bg-cyan-500 text-black' : 'bg-slate-900 border border-cyan-500/20 text-white'} p-3 rounded-xl text-[10px] max-w-[80%] font-bold">
                    ${msg.replace("YOU:", "")}
                </div>
            </div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    },

    async sendMessage() {
        const input = document.getElementById('phone-user-input');
        const text = input.value.trim();
        if (!text) return;
        this.contacts[this.activeContactKey].messages.push(`YOU: ${text}`);
        this.renderMessages();
        input.value = "";
        try {
            const res = await fetch('https://sin-city.onrender.com/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: this.contacts[this.activeContactKey].name, message: text })
            });
            const data = await res.json();
            this.contacts[this.activeContactKey].messages.push(data.response);
            this.renderMessages();
        } catch (e) { console.error(e); }
    }
};

window.PhoneSystem = PhoneSystem;



window.GameState = GameState;
window.UI = UI;
window.handleGoogleLogin = handleGoogleLogin;

let currentSpins = 0;
const icons = ['🕵️‍♂️', '🧪', '🚔', '💰'];


UI.showSlotMachine = function() {
    document.getElementById('claim-rewards-btn').classList.add('hidden');
    document.getElementById('slot-machine-ui').classList.remove('hidden');
    
    
    const outcome = window.lastGameOutcome; 
    currentSpins = (outcome === 'perfect') ? 10 : 1;
    
    document.getElementById('spin-count').innerText = currentSpins;
};


function handleSpinClick() {
    const spinBtn = document.getElementById('spin-button'); // Assuming your button has this ID
    if (currentSpins <= 0 || spinBtn.disabled) return;
    
    // Disable button during animation
    spinBtn.disabled = true;
    currentSpins--;
    document.getElementById('spin-count').innerText = currentSpins;

    const forceWin = Math.random() < 0.6; // 60% chance
    let results = forceWin ? 
        Array(3).fill(icons[Math.floor(Math.random() * icons.length)]) : 
        [icons[0], icons[Math.floor(Math.random() * (icons.length-1)) + 1], icons[1]]; // Ensure variety for loss

    results.forEach((icon, i) => {
        const strip = document.getElementById(`strip${i + 1}`);
        strip.classList.remove('is-spinning'); // Reset animation
        void strip.offsetWidth; // Trigger reflow
        strip.classList.add('is-spinning');
        
        setTimeout(() => {
            strip.style.top = `-${icons.indexOf(icon) * 80}px`;
            strip.classList.remove('is-spinning');

            // --- CHECK FOR WIN OR FINAL LOSS ---
            if (i === 2) {
                const isWin = results[0] === results[1] && results[1] === results[2];
                
                if (isWin) {
                    triggerJackpot();
                } else {
                    if (currentSpins <= 0) {
                        handleFinalLoss();
                    } else {
                        // Re-enable button for next attempt
                        spinBtn.disabled = false;
                        UI.log(`NO LUCK. ${currentSpins} SPINS REMAINING.`, "text-slate-500");
                    }
                }
            }
        }, 1000 + (i * 400));
    });
}

function triggerJackpot() {
    setTimeout(() => {
        const colors = ['#00f3ff', '#ff00ff', '#00ff00', '#ffff00', '#ff003c'];
        const particleCount = 500;

        for (let i = 0; i < particleCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-particle';
            
            // Randomly pick a neon color
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.setProperty('--color', color);
            
            // Random starting position (center of screen)
            confetti.style.left = '50vw';
            confetti.style.top = '50vh';
            
            // Random horizontal and vertical spread
            const velocityX = (Math.random() - 0.5) * 2000; // Wide horizontal burst
            const velocityY = (Math.random() - 0.7) * 1000; // Upward burst
            confetti.style.setProperty('--x', `${velocityX}px`);
            confetti.style.setProperty('--y', `${velocityY}px`);

            document.body.appendChild(confetti);

            // Clean up after animation
            setTimeout(() => confetti.remove(), 4000);
        }

        const winMsg = document.createElement('div');
        winMsg.className = 'winner-toast';
        winMsg.innerHTML = "JACKPOT<br><span style='font-size:1.2rem; letter-spacing: 0.5em; color: var(--cyan);'>REINITIALIZING TERMINAL...</span>";
        document.body.appendChild(winMsg);

        setTimeout(() => location.reload(), 5000);
    }, 1000);
}


function handleFinalLoss() {
    setTimeout(() => {
        const lossMsg = document.createElement('div');
        lossMsg.className = 'winner-toast'; // Reusing your toast style
        lossMsg.style.textShadow = "0 0 20px #ff003c, 0 0 40px #ff003c"; // Red glow for loss
        lossMsg.innerHTML = "BETTER LUCK NEXT TIME<br><span style='font-size:1rem; color: #fff;'>TERMINATING SESSION...</span>";
        document.body.appendChild(lossMsg);

        // Redirect to Login/Refresh after 5 seconds
        setTimeout(() => {
            location.reload();
        }, 5000);
    }, 1000);
}

window.handleSpinClick = handleSpinClick;