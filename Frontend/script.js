const GameState = {
    time: 1440,
    playerName: "Detective",
    currentLoc: "VIP Suite",
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    currentTarget: null,

    patience: { 
        "Elena": { val: 10, max: 10, icon: "🧹", bio: "Casino maid. Knows the service vents.", suspicion: [], secret: "I wasn't in the room! The Guard and I were... occupied in the closet." },
        "Manager": { val: 5, max: 5, icon: "💼", bio: "Oversees floor operations. Deeply in debt.", suspicion: [], secret: "I hate VIPs, but I'm no killer." },
        "Guard": { val: 8, max: 8, icon: "🛡️", bio: "Former military. Recently disciplined.", suspicion: [], secret: "The logs are fake. I was with Elena." },
        "VIP-Arrogant": { val: 4, max: 4, icon: "💎", bio: "Old money. Hiding a scandal.", suspicion: [], secret: "I was having a 'private meeting'. Don't tell my wife." },
        "VIP-Stammer": { val: 6, max: 6, icon: "😰", bio: "Regular gambler. Witnessed the event.", suspicion: [], secret: "I saw Julian hide a needle! He looked possessed!" },
        "VIP-Deaf": { val: 10, max: 10, icon: "🧏", bio: "Retired judge. Sharp eyes.", suspicion: [], secret: "WHAT? I saw that PA leaving the Chemist's room!" },
        "PA-Julian": { val: 5, max: 5, icon: "🧪", bio: "Expert in toxins. Extremely calm.", suspicion: [], secret: "Elias is dead, Detective. I am someone else now." },
        "PA-Viktor": { val: 6, max: 6, icon: "👔", bio: "Junior assistant. Terrified.", suspicion: [], secret: "Julian is too calm. Cold as ice." },
        "PA-Jax": { val: 5, max: 5, icon: "🧥", bio: "Security minded. Always recording.", suspicion: [], secret: "I saw someone in a lab coat. Julian's coat." }
    },

    locations: {
        "VIP Suite": { chars: ["Elena", "PA-Julian", "VIP-Arrogant"], clue: "Oakhaven Diary" },
        "Main Floor": { chars: ["Manager", "Guard", "VIP-Stammer"], clue: "Drug Database" },
        "Bar Lounge": { chars: ["VIP-Deaf", "PA-Viktor", "PA-Jax"], clue: "Casino Ledger" }
    },

    evidenceMeta: { "Pocket Knife": "🔪", "Post-Mortem Report": "📄", "Syringe Mark": "💉", "Oakhaven Diary": "📓", "Drug Database": "💾", "Casino Ledger": "📊" },

    init() {
        this.renderMap();
        this.updateUI();
        document.getElementById('player-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleInput(); });
        document.getElementById('db-query-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.queryDatabase(); });
        setInterval(() => this.recoveryHeartbeat(), 20000);
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
        } else if (this.currentTarget) {
            this.aiTalk(this.currentTarget, raw);
        }
        input.value = "";
    },

    selectTarget(name) {
        this.currentTarget = name;
        this.updateUI();
        UI.log(`INTERROGATING ${name.toUpperCase()}`, "text-cyan-400 text-[10px] tracking-widest");
    },

   async aiTalk(name, message) {
    UI.log(`${this.playerName.toUpperCase()}: "${message}"`, "detective-speech font-bold italic");

    try {
        const response = await fetch('http://localhost:5000/api/interrogate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, message })
        });
        
        const data = await response.json();
        
        this.updateUI();
        await UI.typeLog(`${name}: "${data.response}"`, "text-white font-bold border-l-2 border-cyan-500 pl-4 bg-cyan-950/20 py-2 rounded-r");
    } catch (err) {
        console.error("Connection to server failed:", err);
        UI.log("SERVER CONNECTION ERROR. REBOOT TERMINAL.", "text-red-500");
    }
},

    handleSearch() {
        const clue = this.locations[this.currentLoc].clue;
        if (clue && !this.inventory.includes(clue)) {
            this.inventory.push(clue);
            this.updateTime(15); 
            UI.log(`DATA RECOVERED: ${clue.toUpperCase()}`, "text-yellow-400 font-black");
            this.updateUI();
        } else UI.log("NO NEW INTEL FOUND.");
    },

    travel(loc) {
        if (this.currentLoc === loc) return;
        this.currentLoc = loc;
        this.currentTarget = null;
        this.updateTime(20); 
        UI.log(`MOVED TO ${loc.toUpperCase()}`, "text-cyan-800 tracking-[0.3em]");
        document.getElementById('current-loc-label').innerText = `LOC: ${loc.toUpperCase()}`;
        this.updateUI();
    },

    updateUI() {
        const panel = document.getElementById('character-panel');
        panel.innerHTML = this.locations[this.currentLoc].chars.map(c => {
            const char = this.patience[c];
            const suspicionList = char.suspicion.length > 0 
                ? char.suspicion.map(q => `<li class="mb-2 border-l-2 border-red-600 pl-2 text-white">"${q}"</li>`).join('') 
                : `<li class="text-slate-500 italic">No incriminating statements recorded.</li>`;

            return `
                <div onclick="GameState.selectTarget('${c}')" class="char-card p-3 rounded-lg relative group ${this.currentTarget === c ? 'active-target' : ''}">
                    <div class="flex items-center gap-3">
                        <span class="text-xl">${char.icon}</span>
                        <div class="flex-grow">
                            <p class="text-white text-[10px] font-black uppercase tracking-widest">${c}</p>
                            <div class="flex gap-0.5 mt-1">${Array.from({length: char.max}).map((_, i) => `
                                <div class="w-full h-1 ${i < char.val ? 'bg-cyan-400 shadow-[0_0_5px_#00f3ff]' : 'bg-slate-800'}"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="bio-popup">
                        <p class="text-cyan-400 font-black text-[8px] tracking-[0.3em] mb-2 border-b border-cyan-900 pb-1">SUBJECT_DOSSIER // ${c.toUpperCase()}</p>
                        <p class="text-slate-400 text-[9px] leading-relaxed mb-4">${char.bio}</p>
                        <p class="text-red-500 font-black text-[7px] tracking-widest mb-2 uppercase">Statements:</p>
                        <ul class="list-none text-[9px] space-y-1">${suspicionList}</ul>
                    </div>
                </div>`;
        }).join('');

        const ev = document.getElementById('evidence-list');
        ev.innerHTML = this.inventory.map(i => `
            <div class="evidence-tile rounded-lg p-2 flex flex-col items-center justify-center gap-1 cursor-pointer" onclick="GameState.askCurrentTarget('${i}')">
                <span class="text-2xl">${this.evidenceMeta[i] || '📁'}</span>
                <span class="text-[7px] font-bold uppercase text-center leading-tight">${i}</span>
            </div>`).join('');

        const select = document.getElementById('arrest-select');
        select.innerHTML = `<option disabled selected>SELECT SUBJECT</option>` + Object.keys(this.patience).map(n => `<option value="${n}">${n}</option>`).join('');
        this.renderMap();
    },

    askCurrentTarget(clue) {
        if (!this.currentTarget) {
            if (clue === "Oakhaven Diary") {
                UI.log("--- SCANNING SARAH'S DIARY ---", "text-yellow-500 font-black");
                UI.log("A hidden entry reads: 'I thought I left Oakhaven behind. I thought the testimony bought my freedom. But lately, I feel a pair of eyes on me—cold, clinical eyes. Like he's back.'", "text-yellow-200 border-l border-yellow-500 pl-4 py-2 italic bg-yellow-950/20 block w-full");
            } else {
                UI.log("SELECT A SUBJECT TO SHOW THIS EVIDENCE.", "text-cyan-600");
            }
            return;
        }
        this.aiTalk(this.currentTarget, `Explain this: ${clue}`);
    },

    queryDatabase() {
        const input = document.getElementById('db-query-input');
        const results = document.getElementById('db-results');
        const query = input.value.toUpperCase();
        if (!query) return;

        this.updateTime(10);
        results.innerHTML = `<p class="text-cyan-400 animate-pulse">> ACCESSING SINCITY_PD CENTRAL SERVERS...</p>`;
        
        setTimeout(() => {
            if (query.includes("OAKHAVEN") || query.includes("SARAH")) {
                results.innerHTML = `<p class="text-cyan-100"><span class="text-cyan-400">[FILE FOUND]</span> Case #442-B. Victim B (Sarah) provided testimony against the Oakhaven narcotics ring 5 years ago. Primary target 'The Chemist' incarcerated. Mother of target deceased during sentencing.</p>`;
            } else if (query.includes("ELIAS") || query.includes("CHEMIST") || query.includes("JULIAN")) {
                results.innerHTML = `<p class="text-red-400"><span class="text-red-500">[ENCRYPTED]</span> Elias 'The Chemist' Thorne. Master of neurotoxins. Released 2 weeks ago. NOTE: Underwent facial reconstruction post-release. Current identity unknown.</p>`;
            } else {
                results.innerHTML = `<p class="text-slate-500">>> NO DIRECT MATCHES. TRY: OAKHAVEN, SARAH, ELIAS.</p>`;
            }
        }, 800);
    },

    renderMap() {
        const svg = document.getElementById('casino-map');
        const locs = [
            { n: "VIP Suite", x: 65, y: 10, w: 110, h: 50, icon: "♠️" },
            { n: "Bar Lounge", x: 5, y: 80, w: 110, h: 50, icon: "🍸" },
            { n: "Main Floor", x: 125, y: 80, w: 110, h: 50, icon: "🎰" }
        ];
        svg.innerHTML = locs.map(l => {
            const active = this.currentLoc === l.n;
            return `<g onclick="GameState.travel('${l.n}')" class="cursor-pointer">
                <rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="4" fill="${active ? '#00f3ff22' : '#0f172a'}" stroke="${active ? '#00f3ff' : '#1e293b'}" />
                <text x="${l.x+l.w/2}" y="${l.y+30}" text-anchor="middle" fill="white" font-size="10">${l.icon} ${l.n}</text>
            </g>`;
        }).join('');
    },

    updateTime(m) {
        this.time -= m;
        document.getElementById('time-display').innerText = `${Math.floor(this.time/60).toString().padStart(2,'0')}:${(this.time%60).toString().padStart(2,'0')}`;
        document.getElementById('time-bar').style.width = `${(this.time/1440)*100}%`;
    },

    recoveryHeartbeat() {
        for(let n in this.patience) if(this.patience[n].val < this.patience[n].max) this.patience[n].val++;
        this.updateUI();
    },

    submitFinalTheory() {
        const suspect = document.getElementById('arrest-select').value;
        const theory = document.getElementById('theory-input').value.toLowerCase();
        
        const hasIdentity = theory.includes("elias");
        const hasMotive = theory.includes("oakhaven") || theory.includes("revenge") || theory.includes("testified");
        const hasWeapon = theory.includes("poison") || theory.includes("toxin") || theory.includes("needle");

        if (suspect === "PA-Julian") {
            if (hasIdentity && hasMotive && hasWeapon) {
                alert("CASE CLOSED: You exposed Julian as Elias. He was arrested for the Oakhaven revenge plot. Sarah's death is confirmed as homicide by toxin. EXCELLENT WORK.");
            } else {
                alert("INSUFFICIENT THEORY: You arrested the right person, but your theory lacked the Oakhaven connection or weapon details. He might beat the charge.");
            }
        } else {
            alert(`FAILURE: You arrested ${suspect}. The real killer, Julian (Elias), vanished into the night.`);
        }
        location.reload();
    }
};

const UI = {
    startInvestigation() {
        const nameInput = document.getElementById('user-name-input').value;
        GameState.playerName = nameInput || "DETECTIVE";
        document.getElementById('display-name').innerText = `DET. ${GameState.playerName.toUpperCase()}`;
        const screen = document.getElementById('briefing-screen');
        screen.style.opacity = '0';
        setTimeout(() => {
            screen.style.display = 'none';
            GameState.init();
            UI.log("LOCAL NETWORK ACCESSED...", "text-cyan-800 animate-pulse");
            UI.log(`WELCOME, DET. ${GameState.playerName.toUpperCase()}.`, "text-cyan-400 font-bold");
        }, 500);
    },
    log(m, c) {
        const l = document.getElementById('game-log');
        const p = document.createElement('p');
        p.className = c || "text-slate-400 my-1";
        p.innerHTML = `> ${m}`;
        l.appendChild(p);
        l.scrollTop = l.scrollHeight;
    },
    async typeLog(message, className) {
        const l = document.getElementById('game-log');
        const p = document.createElement('p');
        p.className = className + " my-2";
        l.appendChild(p);
        for (let i = 0; i < message.length; i++) {
            p.innerHTML += message[i];
            l.scrollTop = l.scrollHeight;
            await new Promise(r => setTimeout(r, 10));
        }
    },
    toggleAccusation() { document.getElementById('accuse-modal').classList.toggle('hidden'); },
    toggleDatabase() { document.getElementById('database-modal').classList.toggle('hidden'); }
};
// This function is triggered by your Login Button
async function handleGameStart() {
    const user = await window.loginWithGoogle();
    if (user) {
        // Update the UI with the detective's name
        document.getElementById('display-name').innerText = `Det. ${user.displayName}`;
        
        // Hide the briefing screen
        document.getElementById('briefing-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('briefing-screen').classList.add('hidden');
        }, 500);

        // Call your existing game start logic
        UI.startInvestigation(); 
    }
}

window.UI = UI; window.GameState = GameState;