** SinCity Investigator: A Noir AI Mystery**
HackNite 2026 | Web Development Track | **Team Neon Protocol**

SinCity Investigator is an immersive, AI-powered detective experience. Built for the HackNite 2026 "SinCity" theme, it challenges players to solve a high-profile homicide using digital forensic tools, suspect interrogation, and logical arguments.

**🔗 Live Case Access**
The investigation is live and optimized for high-performance terminal interaction:
    1. ** Live Investigation (Frontend):** https://sin-city-wheat.vercel.app/
    2. ** Case Files (Source Code):** https://github.com/aashh77/SinCity.git

##  Problem Statement
Traditional narrative games rely on rigid branching paths and "point-and-click" simplicity. SinCity Investigator redefines the genre by introducing Dynamic Interrogation.

We solve the "predictability problem" by using Large Language Models (LLMs) to power NPC personalities. Suspects don't just follow a script—they react to your tone, your evidence, and their own hidden "Patience" levels, making every playthrough a unique psychological battle.

---

##  Tech Stack
- **Frontend:** HTML5, **Custom Modular CSS** (Neon-Noir Aesthetics),JavaScript
- **Backend:** Node.js & Express.js
- **Database:** MongoDB Atlas (Persistent Evidence & Suspect State)
- **AI Engine:** GROQ AI (Interrogation & Logic Verification)
- **Auth:** Firebase Google Authentication
- **Deployment:** Vercel (Frontend), Render (Backend)

---

##  Key Features

### 1. AI-Driven Interrogation
Suspects respond dynamically. Using the *GROQ API**, we've implemented a "Patience System." If you press a suspect too hard without evidence, they will terminate the session and call security.

### 2. "SinCity OS" Mobile System
- **Encrypted Messaging:** Chat with your wife (Maya), your boss (Chief Miller), or your partner (Dave). Some provide emotional grounding; others provide critical hints.

- **Underground Casino (7 Up 7 Down):** A high-stakes mini-game.
        **The Risk:** A loss results in a 20-minute time penalty.
        **The Reward:** A win decrypts a Hidden Intel Leak that is pushed directly to your main terminal log and phone history.

### 3. Forensic Evidence Locker & Database
- **Evidence Locker:** A centralized system tracking physical items (like Sarah's Diary) and forensic samples.

- **Criminal Database:** A restricted terminal where players cross-reference names and organizations found during interrogation to uncover hidden pasts.

### 4. Natural Language "Warrant" System (Technical Innovation)
One of our most unique features. Instead of a "Click to Win" button, players must write out their theory. Our **AI "Judge"** analyzes the user's input against the hidden database "Truth" to verify if the logic, motive, and evidence citations are correct.

### 5. The Bonus Round: Casino Vault
After the AI grades your final verdict, the investigation moves to the Casino Vault:
- **Performance Rewards:** A perfect theory grants 10 spins, while flawed or partial reasoning grants fewer.

- **The Finale:** Hit the jackpot to trigger a High-End Neon Spark physics burst. If you run out of turns, the session terminates with a "Better Luck Next Time" red-line redirect.

### 6. Admin Over-ride (cheatcodes)
- ** Use secret codes that allows some leeway in the game.

### 7. Interactive Clipboard
- ** Like a real detective's clipboard. Allows you to strike off the suspects you have cleared. Lets you make notes on suspects.

### 8. Stats
- ** The game provides a crazy statistic (e.g. the time spent gambling) towards the end.

---

##  Technical Architecture

1. **Client:** Handles the Neon-Noir UI and local game state (GameState Engine).
2. **Express Server**: Acts as the secure bridge, protecting API keys and managing database queries.
3. **MongoDB:** Stores the "Ground Truth" for the mystery and persists user statistics (Wins/Losses).
4. **AI Engine:** Powers the NPC dialogue and evaluates the final complex win condition.

---

## FUTURE SCOPE OF DEVELOPMENT

1. **AI generated plotlines**, evidences, suspects, criminals and story lines. A new game everytime you play it.

2. Making it **multi-player** so two detectives can investigate together. Using web sockets for bi-directionl low latency updates. When a player opens the game, it matches them with another player, who is ready to play.

3. **Corrupt cop ending**- Moral dilemmas and dealing with the fallout of those decisions (e.g. bribery)

4. **CCTV footage**- to make it more visual.

5. **Upping the stakes** by having real time event occur (e.g. killing off one of the suspects realtime after an interrogation).

6. More **mini-games**- Like **Russian Roulette** and **Poker**

7. Better **Forensic evidence**- allows you to visually analyse post-mortem reports and other evidences. 

8. Making the **Criminal database** more extensive.

9. Use of **Lie Detectors** and **Truth Serums** as power-ups.

10. After catching the criminal, **generation of a mugshot (interative)**

11. Implementing **Text-to-Voice** and **Voice-to-Text** with an **Emotion-Anayzer** that gives approprite responses from suspects.


🌑 **THE PLOT (SPOILER WARNING)**
<details>
<summary><b>[CONFIDENTIAL] Click to reveal for Evaluators</b></summary>

**The Truth**
1. **The Killer:** Julian Vane

2. **The Identity:** He is actually 'Elias', a chemist from the Oakhaven Drug Ring.

3. **The Primary Target:** Sarah (the Assistant). She was the one who provided the state evidence that dismantled his operation in the past. He used a custom-engineered synthetic toxin designed to mimic a natural heart attack, masking the murder as a medical emergency.

4. **The VIP Fatality: Accidental.** The VIP official was blindsided and caught in the crossfire during the assassination attempt on Sarah. Julian had to eliminate the witness to cover his tracks. So, Julian stabbed him with a pocket knife.

5. **To Win:** The player must find the diary, check the database for "Oakhaven," and correctly identify Julian's alias (Elias) in the final theory submission.

</details>