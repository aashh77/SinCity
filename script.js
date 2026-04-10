const GameState = {
    time: 1440,
    playerName: "Detective",
    currentLoc: "VIP Suite",
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    currentTarget: null,

    patience: { 
        "Elena": { val: 10, max: 10, icon: "🧹", secret: "I wasn't in the room! The Guard and I were... occupied in the closet." },
        "Manager": { val: 5, max: 5, icon: "💼", secret: "I hate VIPs, but I'm no killer." },
        "Guard": { val: 8, max: 8, icon: "🛡️", secret: "The logs are fake. I was with Elena." },
        "VIP-Arrogant": { val: 4, max: 4, icon: "💎", secret: "I was having a 'private meeting' with the Guard. Don't tell my wife." },
        "VIP-Stammer": { val: 6, max: 6, icon: "😰", secret: "I-I-I saw Julian hide a needle!" },
        "VIP-Deaf": { val: 10, max: 10, icon: "🧏", secret: "WHAT? SYRINGE? I KNEW THAT PA WAS A FREAK!" },
        "PA-Julian": { val: 5, max: 5, icon: "🧪", secret: "Elias is dead, Detective. I am someone else now." },
        "PA-Viktor": { val: 6, max: 6, icon: "👔", secret: "Julian is too calm. Cold as ice." },
        "PA-Jax": { val: 5, max: 5, icon: "🧥", secret: "I saw someone by the service lift." }
    },

    locations: {
        "VIP Suite": { chars: ["Elena", "PA-Julian", "VIP-Arrogant"], clue: "Oakhaven Diary" },
        "Main Floor": { chars: ["Manager", "Guard", "VIP-Stammer"], clue: "Drug Database" },
        "Bar Lounge": { chars: ["VIP-Deaf", "PA-Viktor", "PA-Jax"], clue: "Casino Ledger" }
    },

    evidenceMeta: {
        "Pocket Knife": "🔪", "Post-Mortem Report": "📄", "Syringe Mark": "💉",
        "Oakhaven Diary": "📓", "Drug Database": "💾", "Casino Ledger": "📊",
        "ID: Sarah (Victim)": "🆔", "ID: Elias (Chemist)": "🧪"
    },

    init() {
        this.renderMap();
        this.updateUI();
        UI.log("SYSTEM ONLINE. BEGIN INVESTIGATION.", "text-cyan-500 font-bold");
        setInterval(() => this.recoveryHeartbeat(), 20000);
    },

    handleInput() {
        const input = document.getElementById('player-input');
        const raw = input.value.trim();
        if (raw.toUpperCase().startsWith("TALK TO")) {
            const name = Object.keys(this.patience).find(n => raw.toUpperCase().includes(n.toUpperCase()));
            if (name) this.selectTarget(name, raw.split(":")[1] || "Hello.");
        } else if (raw.toUpperCase() === "SEARCH") {
            this.handleSearch();
        } else if (this.currentTarget) {
            this.aiTalk(this.currentTarget, raw);
        }
        input.value = "";
    },

    selectTarget(name, initialMsg) {
        this.currentTarget = name;
        this.updateUI();
        if (initialMsg) this.aiTalk(name, initialMsg);
        document.getElementById('player-input').placeholder = `INTERROGATING ${name.toUpperCase()}...`;
    },

    async aiTalk(name, message) {
        const msg = message.toUpperCase();
        let response = "I have nothing to say.";
        const p = this.patience[name];

        if (p.val <= 0) return UI.log(`${name.toUpperCase()} REFUSES TO SPEAK.`, "text-red-500");
        p.val--;
        UI.log(`${this.playerName.toUpperCase()}: "${message}"`, "text-slate-500 italic");

        if (name === "VIP-Deaf" && message !== message.toUpperCase()) response = "WHAT?! SPEAK UP!";
        else if (msg.includes("AFFAIR") || msg.includes("CLOSET")) response = p.secret;
        else if (msg.includes("ELIAS") || msg.includes("OAKHAVEN")) {
            if (name === "PA-Julian") { p.val = 0; response = "You shouldn't have dug that up. We're done."; }
            else if (name === "VIP-Deaf") response = "OAKHAVEN? THE PA JULIAN IS FROM THERE!";
        } else if (msg.includes("NEEDLE") || msg.includes("SYRINGE")) {
            if (name === "VIP-Stammer") response = p.secret;
        }

        this.updateUI();
        await UI.typeLog(`${name}: "${response}"`, "text-white font-bold border-l-2 border-cyan-500 pl-4");
    },

    handleSearch() {
        const clue = this.locations[this.currentLoc].clue;
        if (clue && !this.inventory.includes(clue)) {
            this.inventory.push(clue);
            UI.log(`DATA RECOVERED: ${clue.toUpperCase()}`, "text-yellow-400 font-black");
            if (clue === "Oakhaven Diary") { this.inventory.push("ID: Sarah (Victim)"); this.inventory.push("ID: Elias (Chemist)"); }
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
        panel.innerHTML = this.locations[this.currentLoc].chars.map(c => `
            <div onclick="GameState.selectTarget('${c}')" class="char-card p-3 rounded-lg ${this.currentTarget === c ? 'active-target' : ''}">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${this.patience[c].icon}</span>
                    <div class="flex-grow">
                        <p class="text-white text-[10px] font-black uppercase tracking-widest">${c}</p>
                        <div class="flex gap-0.5 mt-1">${Array.from({length: this.patience[c].max}).map((_, i) => `
                            <div class="w-full h-1 ${i < this.patience[c].val ? 'bg-cyan-500 shadow-[0_0_5px_#00f3ff]' : 'bg-slate-800'}"></div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        const ev = document.getElementById('evidence-list');
        ev.innerHTML = this.inventory.map(i => `
            <div class="evidence-tile rounded-lg" onclick="GameState.askCurrentTarget('${i}')">
                <span class="text-2xl">${this.evidenceMeta[i] || '📁'}</span>
                <span class="text-[8px] font-bold uppercase text-center">${i}</span>
            </div>`).join('');

        const select = document.getElementById('arrest-select');
        select.innerHTML = `<option disabled selected>SELECT SUBJECT</option>` + Object.keys(this.patience).map(n => `<option value="${n}">${n}</option>`).join('');
        this.renderMap();
    },

    askCurrentTarget(clue) {
        if (!this.currentTarget) return UI.log("SELECT A SUBJECT FIRST.");
        this.aiTalk(this.currentTarget, `Explain this: ${clue}`);
    },

    renderMap() {
        const svg = document.getElementById('casino-map');
        const locs = [{ n: "VIP Suite", x: 85, y: 30, w: 70, h: 50 }, { n: "Main Floor", x: 85, y: 160, w: 70, h: 50 }, { n: "Bar Lounge", x: 15, y: 95, w: 60, h: 50 }];
        svg.innerHTML = locs.map(l => `
            <rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="4" onclick="GameState.travel('${l.n}')" class="map-node ${this.currentLoc === l.n ? 'active' : ''}"/>
            <text x="${l.x+l.w/2}" y="${l.y+l.h/2+4}" text-anchor="middle" fill="#fff" font-size="5" font-family="Syncopate" class="pointer-events-none">${l.n.toUpperCase()}</text>
        `).join('');
    },

    updateTime(m) {
        this.time -= m;
        document.getElementById('time-display').innerText = `${Math.floor(this.time/60)}:${(this.time%60).toString().padStart(2,'0')}`;
        document.getElementById('time-bar').style.width = `${(this.time/1440)*100}%`;
    },

    recoveryHeartbeat() {
        for(let n in this.patience) if(this.patience[n].val < this.patience[n].max) this.patience[n].val++;
        this.updateUI();
    },

    submitFinalTheory() {
        if (document.getElementById('arrest-select').value === "PA-Julian") alert("CASE CLOSED: ELIAS APPREHENDED.");
        else alert("FAILURE: THE KILLER ESCAPED.");
        location.reload();
    }
};

const UI = {
    startInvestigation() {
        GameState.playerName = document.getElementById('user-name-input').value || "DETECTIVE";
        document.getElementById('display-name').innerText = `DET. ${GameState.playerName.toUpperCase()}`;
        document.getElementById('briefing-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('briefing-screen').style.display = 'none', 500);
        GameState.init();
    },
    log(m, c) {
        const l = document.getElementById('game-log');
        const p = document.createElement('p');
        p.className = c || "text-slate-400";
        p.innerHTML = `> ${m}`;
        l.appendChild(p);
        l.scrollTop = l.scrollHeight;
    },
    async typeLog(message, className) {
        const l = document.getElementById('game-log');
        const p = document.createElement('p');
        p.className = className;
        l.appendChild(p);
        for (let i = 0; i < message.length; i++) {
            p.innerHTML += message[i];
            l.scrollTop = l.scrollHeight;
            await new Promise(r => setTimeout(r, 15));
        }
    },
    toggleAccusation() { document.getElementById('accuse-modal').classList.toggle('hidden'); }
};