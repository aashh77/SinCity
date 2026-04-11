const GameState = {
    time: 1440, // 24 hours in minutes
    playerName: "Detective",
    currentLoc: "VIP Suite",
    inventory: ["Pocket Knife", "Post-Mortem Report", "Syringe Mark"],
    currentTarget: null,

    patience: { 
        "Elena": { 
            val: 10, max: 10, icon: "🧹", 
            bio: "Casino maid. Knows the service vents and staff schedules better than the architect.",
            suspicion: [], 
            secret: "I wasn't in the room! The Guard and I were... occupied in the closet." 
        },
        "Manager": { 
            val: 5, max: 5, icon: "💼", 
            bio: "Oversees floor operations. Deeply in debt to the House, making him desperate for a clean-up.",
            suspicion: [], 
            secret: "I hate VIPs, but I'm no killer. I just look the other way for a price." 
        },
        "Guard": { 
            val: 8, max: 8, icon: "🛡️", 
            bio: "Former military. Recently disciplined for missing a shift during a high-stakes heist.",
            suspicion: [], 
            secret: "The logs are fake. I was with Elena. Check the service lift cameras if you don't believe me." 
        },
        "VIP-Arrogant": { 
            val: 4, max: 4, icon: "💎", 
            bio: "Old money, new vices. Thinks everyone in this casino is beneath his custom-tailored boots.",
            suspicion: [], 
            secret: "I was having a 'private meeting' with the Guard. Don't tell my wife; she controls the trust fund." 
        },
        "VIP-Stammer": { 
            val: 6, max: 6, icon: "😰", 
            bio: "A regular at the baccarat tables. Looks like he hasn't slept since the victim arrived.",
            suspicion: [], 
            secret: "I-I-I saw Julian hide a needle! He looked... possessed! Like he was finishing a ritual." 
        },
        "VIP-Deaf": { 
            val: 10, max: 10, icon: "🧏", 
            bio: "A retired judge. Hard of hearing, but has the sharpest eyes in the lounge.",
            suspicion: [], 
            secret: "WHAT? SYRINGE? I KNEW THAT PA WAS A FREAK! I saw him leaving the Chemist's room!" 
        },
        "PA-Julian": { 
            val: 5, max: 5, icon: "🧪", 
            bio: "The victim's personal assistant. Expert in high-end pharmaceuticals and synthetic toxins.",
            suspicion: [], 
            secret: "Elias is dead, Detective. I am someone else now. This city changes people." 
        },
        "PA-Viktor": { 
            val: 6, max: 6, icon: "👔", 
            bio: "Junior assistant to the victim. Loyal to a fault, or perhaps just terrified.",
            suspicion: [], 
            secret: "Julian is too calm. Cold as ice. He didn't even flinch when the body was found." 
        },
        "PA-Jax": { 
            val: 5, max: 5, icon: "🧥", 
            bio: "The security-minded assistant. Always carries a pocket knife and a hidden recorder.",
            suspicion: [], 
            secret: "I saw someone by the service lift around 2 AM. Tall, wearing a lab coat. Julian's coat." 
        }
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

        // 1. Enter Key Listener
        const inputField = document.getElementById('player-input');
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                this.handleInput();
            }
        });

        UI.log("SYSTEM ONLINE. BEGIN INVESTIGATION.", "text-cyan-500 font-bold");
        setInterval(() => this.recoveryHeartbeat(), 20000);
    },

    handleInput() {
        const input = document.getElementById('player-input');
        const raw = input.value.trim();
        if (!raw) return;

        const cmd = raw.toUpperCase();

        if (cmd.startsWith("TALK TO")) {
            const name = Object.keys(this.patience).find(n => cmd.includes(n.toUpperCase()));
            if (name) this.selectTarget(name, raw.split(":")[1] || null);
        } else if (cmd === "SEARCH") {
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
        const msg = message.toLowerCase(); // Use lowercase for keywords
        let response = "I have nothing to say about that, Detective.";
        const p = this.patience[name];

        if (p.val <= 0) return UI.log(`${name.toUpperCase()} IS UNRESPONSIVE.`, "text-red-500 font-black");
        
        p.val--;
        this.updateTime(5); 
        UI.log(`${this.playerName.toUpperCase()}: "${message}"`, "text-slate-500 italic text-[10px]");

        // --- DYNAMIC RESPONSE LOGIC ---
        
        if (name === "VIP-Deaf" && message !== message.toUpperCase()) {
            response = "WHAT?! SPEAK UP! I CAN'T HEAR YOU!";
        } 
        
        // 1. Alibi Logic (Elena, Guard, Arrogant)
        else if (msg.includes("affair") || msg.includes("closet") || msg.includes("guard") || msg.includes("elena")) {
            if (name === "Elena" || name === "Guard" || name === "VIP-Arrogant") {
                response = p.secret; // <--- This pulls the EXACT string from your data
            }
        }

        // 2. The Killer's Identity (Julian / Elias / Oakhaven)
        else if (msg.includes("elias") || msg.includes("oakhaven") || msg.includes("diary") || msg.includes("julian")) {
            if (name === "PA-Julian") { 
                p.val = 0; 
                response = p.secret; // <--- Pulls EXACT string for Julian
            }
            else if (name === "VIP-Deaf") response = "OAKHAVEN? THE ASSISTANT JULIAN IS FROM THERE!";
            else response = "I don't know anything about that.";
        }

        // --- THE "CATCHER" ---
        // Now that response IS p.secret, this comparison will finally work!
        if (response === p.secret && !p.suspicion.includes(response)) {
            p.suspicion.push(response);
        }

        this.updateUI(); // Refreshes the Dossier Popup immediately
        await UI.typeLog(`${name}: "${response}"`, "text-white font-bold border-l-2 border-cyan-500 pl-4 bg-cyan-950/20 py-2 rounded-r");
    },

    handleSearch() {
        const clue = this.locations[this.currentLoc].clue;
        if (clue && !this.inventory.includes(clue)) {
            this.inventory.push(clue);
            // Timer Change: Search cost
            this.updateTime(15); 
            UI.log(`DATA RECOVERED: ${clue.toUpperCase()}`, "text-yellow-400 font-black");
            if (clue === "Oakhaven Diary") { 
                this.inventory.push("ID: Sarah (Victim)"); 
                this.inventory.push("ID: Elias (Chemist)"); 
            }
            this.updateUI();
        } else UI.log("NO NEW INTEL FOUND.");
    },

    travel(loc) {
        if (this.currentLoc === loc) return;
        this.currentLoc = loc;
        this.currentTarget = null;
        // Timer Change: Travel cost
        this.updateTime(20); 
        UI.log(`MOVED TO ${loc.toUpperCase()}`, "text-cyan-800 tracking-[0.3em]");
        document.getElementById('current-loc-label').innerText = `LOC: ${loc.toUpperCase()}`;
        this.updateUI();
    },

    updateUI() {
        const panel = document.getElementById('character-panel');
        panel.innerHTML = this.locations[this.currentLoc].chars.map(c => {
            const char = this.patience[c];
            
            // Generate the list of suspicious quotes for the popup
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
                        <p class="text-red-500 font-black text-[7px] tracking-widest mb-2 uppercase">Suspicious Activity:</p>
                        <ul class="list-none text-[9px] space-y-1">
                            ${suspicionList}
                        </ul>
                    </div>
                </div>
            `;
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
        if (!this.currentTarget) return UI.log("SELECT A SUBJECT FIRST.", "text-red-400");
        this.aiTalk(this.currentTarget, `Explain this: ${clue}`);
    },

    renderMap() {
    const svg = document.getElementById('casino-map');
    if (!svg) return;

    // A slightly larger viewbox gives us room to draw a "hallway" floor plan
    // [Central Hallway] with [Bar] to left, [Suite] top, [Main Floor] bottom
    const locs = [
        { n: "VIP Suite",   x: 65,  y: 10,  w: 110, h: 50, icon: "♠️" },
        { n: "Bar Lounge",  x: 5,   y: 80,  w: 110, h: 50, icon: "🍸" },
        { n: "Main Floor",  x: 125, y: 80,  w: 110, h: 50, icon: "🎰" }
    ];

    // Reset viewbox to match the original layout proportions for high resolution
    svg.setAttribute("viewBox", "0 0 240 240");

    svg.innerHTML = `
        <path d="M120,60 V190 M10,130 H230" stroke="#00f3ff22" stroke-width="1" />
        <circle cx="120" cy="130" r="10" fill="#020617" stroke="#00f3ff22" />

        ${locs.map(l => {
            const isActive = this.currentLoc === l.n;
            const targetColor = isActive ? "#00f3ff" : "#1e293b"; // Bright cyan vs dark blue-gray
            const bgColor = isActive ? "#00f3ff11" : "#0f172a80"; // Slight glow vs dark slate
            
            return `
                <g onclick="GameState.travel('${l.n}')" class="map-node group" style="cursor: pointer;">
                    
                    <rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="6" 
                          fill="${bgColor}" 
                          stroke="${targetColor}" 
                          stroke-width="${isActive ? '2' : '1'}"
                          class="transition-all duration-300 group-hover:stroke-cyan-500 group-hover:fill-cyan-950/40" />
                    
                    <text x="${l.x + l.w/2}" y="${l.y + l.h/2 - 2}" 
                          text-anchor="middle" 
                          fill="${isActive ? '#fff' : '#475569'}" 
                          font-size="14" 
                          class="pointer-events-none transition-all duration-300 group-hover:fill-white">
                          ${l.icon}
                    </text>

                    <text x="${l.x + l.w/2}" y="${l.y + l.h/2 + 15}" 
                          text-anchor="middle" 
                          fill="${isActive ? '#fff' : '#475569'}" 
                          font-family="monospace" 
                          font-weight="900" 
                          font-size="8" 
                          style="pointer-events: none; text-transform: uppercase; letter-spacing: 1px;"
                          class="transition-all duration-300 group-hover:fill-white">
                          ${l.n}
                    </text>
                    
                    ${isActive ? `
                        <circle cx="${l.x + 10}" cy="${l.y + 10}" r="3" fill="#00f3ff" class="animate-pulse shadow-[0_0_10px_#00f3ff]" />
                    ` : ''}
                </g>
            `;
        }).join('')}
    `;
},

    updateTime(m) {
        this.time -= m;
        if (this.time <= 0) {
            alert("TIME EXPIRED. THE KILLER ESCAPED.");
            location.reload();
        }
        document.getElementById('time-display').innerText = `${Math.floor(this.time/60).toString().padStart(2,'0')}:${(this.time%60).toString().padStart(2,'0')}`;
        document.getElementById('time-bar').style.width = `${(this.time/1440)*100}%`;
    },

    recoveryHeartbeat() {
        for(let n in this.patience) if(this.patience[n].val < this.patience[n].max) this.patience[n].val++;
        this.updateUI();
    },

    submitFinalTheory() {
        if (document.getElementById('arrest-select').value === "PA-Julian") alert("WIN: ELIAS APPREHENDED.");
        else alert("FAILURE: WRONG ARREST.");
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
    toggleAccusation() { document.getElementById('accuse-modal').classList.toggle('hidden'); }
};

window.UI = UI;
window.GameState = GameState;