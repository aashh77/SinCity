const GameState = {
    time: 1440, playerName: "Detective", currentLoc: "VIP Suite",
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    flags: { overdoseSeen: false, oakhavenKnown: false },
    currentTarget: null,

    patience: { 
        "Elena": { val: 10, max: 10, icon: "🧹", secret: "I wasn't in the room! The Security Guard and I were... occupied in the closet." },
        "Manager": { val: 5, max: 5, icon: "💼", secret: "I hate VIPs, but I'm no killer." },
        "Guard": { val: 8, max: 8, icon: "🛡️", secret: "The logs are fake. I was with Elena." },
        "VIP-Arrogant": { val: 4, max: 4, icon: "💎", secret: "I was having a 'private meeting' with the Guard. Don't tell my wife." },
        "VIP-Stammer": { val: 6, max: 6, icon: "😰", secret: "I-I-I saw Julian (PA) hide a needle!" },
        "VIP-Deaf": { val: 10, max: 10, icon: "🧏", secret: "WHAT? SYRINGE? I KNEW THAT PA WAS A FREAK!" },
        "PA-Julian": { val: 5, max: 5, icon: "🧪", secret: "Elias is dead, Detective. I am someone else now." }, // THE KILLER
        "PA-Viktor": { val: 6, max: 6, icon: "👔", secret: "Julian is too calm. Cold as ice." },
        "PA-Jax": { val: 5, max: 5, icon: "🧥", secret: "I saw someone by the service lift." }
    },

    locations: {
        "VIP Suite": { chars: ["Elena", "PA-Julian", "VIP-Arrogant"], clue: "Oakhaven Diary", icon: "🚪" },
        "Main Floor": { chars: ["Manager", "Guard", "VIP-Stammer"], clue: "Drug Database", icon: "🏢" },
        "Bar Lounge": { chars: ["VIP-Deaf", "PA-Viktor", "PA-Jax"], clue: "Casino Ledger", icon: "🍸" }
    },

    init() {
        this.renderMap();
        this.updateUI();
        setInterval(() => this.recoveryHeartbeat(), 20000);
    },

    handleInput() {
        const input = document.getElementById('player-input');
        const raw = input.value.trim();
        const upper = raw.toUpperCase();

        // RECOGNIZING INTENT
        if (upper.startsWith("TALK TO")) {
            const nameMatch = Object.keys(this.patience).find(n => upper.includes(n.toUpperCase()));
            if (nameMatch) {
                this.currentTarget = nameMatch;
                const message = raw.split(":")[1] || "";
                this.aiTalk(nameMatch, message);
            }
        } else if (upper.includes("SEARCH")) {
            this.handleSearch();
        } else {
            UI.log("USE: 'TALK TO [NAME]: Message' or 'SEARCH'");
        }
        input.value = "";
    },

    // AI DIALOGUE ENGINE
    aiTalk(name, message) {
        const msg = message.toUpperCase();
        let response = "I don't know what you're talking about.";
        const p = this.patience[name];

        if (p.val <= 0) return UI.log(`${name} is done talking to you.`);
        p.val--;

        // Hearing Mechanic
        if (name === "VIP-Deaf" && message !== message.toUpperCase()) {
            response = "WHAT?! STOP MUMBLING! SPEAK UP! (Use CAPS)";
            return UI.log(`${name}: "${response}"`, "text-white font-bold");
        }

        // Logic branching based on Keywords
        if (msg.includes("AFFAIR") || msg.includes("CLOSET") || msg.includes("GUARD")) {
            if (name === "Elena" || name === "Guard") response = p.secret;
            if (name === "VIP-Arrogant") response = p.secret;
        } else if (msg.includes("OAKHAVEN") || msg.includes("SARAH") || msg.includes("ELIAS")) {
            if (name === "PA-Julian") { p.val = 0; response = "(His eyes go cold) My past was buried. It should stay that way."; }
            else if (name === "VIP-Deaf") response = "OAKHAVEN? THAT FILTHY DRUG TOWN? THE PA Julian IS FROM THERE!";
        } else if (msg.includes("NEEDLE") || msg.includes("SYRINGE") || msg.includes("MARK")) {
            if (name === "VIP-Stammer") response = p.secret;
            if (name === "PA-Julian") response = "I carry medical supplies for my client. It's standard.";
        } else if (msg.includes("MURDER") || msg.includes("KILL")) {
            if (name === "Elena") response = "The blood... the VIP wasn't supposed to be there. I saw his face...";
        }

        UI.log(`DET: "${message}"`, "text-cyan-500 text-sm");
        setTimeout(() => UI.log(`${name}: "${response}"`, "text-white font-bold"), 400);
        this.updateUI();
    },

    handleSearch() {
        const clue = this.locations[this.currentLoc].clue;
        if (clue && !this.inventory.includes(clue)) {
            this.inventory.push(clue);
            UI.log(`[DATA RECOVERED]: ${clue.toUpperCase()}`, "text-yellow-400 font-black");
            if (clue === "Oakhaven Diary") {
                this.inventory.push("Old Name: Sarah (Victim)");
                this.inventory.push("Old Name: Elias (Chemist)");
            }
            this.updateUI();
        } else {
            UI.log("Search yielded no new results.");
        }
    },

    travel(loc) {
        this.currentLoc = loc;
        this.updateTime(20);
        UI.log(`MOVED TO ${loc.toUpperCase()}`, "text-slate-500");
        this.updateUI();
    },

    updateUI() {
        const panel = document.getElementById('character-panel');
        panel.innerHTML = this.locations[this.currentLoc].chars.map(c => `
            <div class="p-3 bg-slate-900 border-l-4 border-cyan-500">
                <p class="text-white text-xs font-bold">${this.patience[c].icon} ${c}</p>
                <p class="text-[9px] text-slate-500">Patience: ${this.patience[c].val}/${this.patience[c].max}</p>
            </div>
        `).join('');

        const ev = document.getElementById('evidence-list');
        ev.innerHTML = this.inventory.map(i => `
            <div class="evidence-item" onclick="GameState.askCurrentTarget('${i}')">
                <span>📁</span> ${i}
            </div>
        `).join('');

        const select = document.getElementById('arrest-select');
        select.innerHTML = Object.keys(this.patience).map(n => `<option value="${n}">${n}</option>`).join('');
        this.renderMap();
    },

    askCurrentTarget(clue) {
        if (!this.currentTarget) return UI.log("Talk to someone first!");
        this.aiTalk(this.currentTarget, `What do you know about ${clue}?`);
    },

    renderMap() {
        const svg = document.getElementById('casino-map');
        const locs = [
            { n: "VIP Suite", x: 80, y: 20, w: 80, h: 60 },
            { n: "Main Floor", x: 80, y: 150, w: 80, h: 60 },
            { n: "Bar Lounge", x: 10, y: 85, w: 60, h: 60 }
        ];
        svg.innerHTML = locs.map(l => `
            <rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="8" 
                onclick="GameState.travel('${l.n}')" 
                class="map-node ${this.currentLoc === l.n ? 'active' : ''}"/>
            <text x="${l.x+l.w/2}" y="${l.y+l.h/2+5}" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold">${l.n}</text>
        `).join('');
    },

    updateTime(m) { this.time -= m; document.getElementById('time-display').innerText = `${Math.floor(this.time/60)}:00`; },
    recoveryHeartbeat() {
        for(let n in this.patience) { if(this.patience[n].val < this.patience[n].max) this.patience[n].val++; }
        this.updateUI();
    },
    submitFinalTheory() {
        const val = document.getElementById('arrest-select').value;
        if (val === "PA-Julian") alert("CASE CLOSED: ELIAS APPREHENDED.");
        else alert("WRONG ARREST. THE CHEMIST HAS VANISHED.");
        location.reload();
    }
};

const UI = {
    startInvestigation() {
        GameState.playerName = document.getElementById('user-name-input').value || "DETECTIVE";
        document.getElementById('display-name').innerText = `DET. ${GameState.playerName.toUpperCase()}`;
        document.getElementById('briefing-screen').style.display = 'none';
        GameState.init();
    },
    log(m, c) {
        const l = document.getElementById('game-log');
        const p = document.createElement('p');
        p.className = c || "text-slate-300";
        p.innerHTML = `> ${m}`;
        l.appendChild(p);
        l.scrollTop = l.scrollHeight;
    },
    toggleAccusation() { document.getElementById('accuse-modal').classList.toggle('hidden'); }
};