# 🕵️‍♂️ SinCity Investigator: A Noir AI Mystery
**HackNite 2026 | Web Development Track | Team SinCity**

> "The rain pours down on a city filled with corruption, but you're the only one looking for the truth."

SinCity Investigator is an immersive, AI-powered detective experience. Built for the HackNite 2026 "SinCity" theme, it challenges players to solve a high-profile homicide using digital forensic tools, suspect interrogation, and logical arguments.

---

## 📝 Problem Statement
Traditional narrative games rely on rigid branching paths and "point-and-click" simplicity. **SinCity Investigator** redefines the genre by introducing **Dynamic Interrogation**. 

We solve the "predictability problem" by using Large Language Models (LLMs) to power NPC personalities. Suspects don't just follow a script- they react to your tone, your evidence, and their own hidden "Patience" levels, making every playthrough a unique psychological battle.

---

## 🚀 Tech Stack
- **Frontend:** HTML5, **Custom Modular CSS** (Neon-Noir Aesthetics), Vanilla JavaScript
- **Backend:** Node.js & Express.js
- **Database:** MongoDB Atlas (Persistent Evidence & Suspect State)
- **AI Engine:** GROQ AI (Interrogation & Logic Verification)
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🎮 Key Features

### 1. AI-Driven Interrogation
Suspects respond dynamically. Using the *GROQ API**, we've implemented a "Patience System." If you press a suspect too hard without evidence, they will terminate the session and call security.

### 2. The Tactical Map & Dossier System
- **Real-time Navigation:** Travel between the VIP Suite, Bar Lounge, and Casino Floor.
- **Dossier Pop-ups:** Interactive UI elements that provide a "Tactical Overlay" of suspect history and current threat levels.

### 3. Forensic Evidence Locker
A **centralized inventory system** that tracks physical items (like Sarah's Diary) and **digital intel (Criminal Database records)**.

### 4. Natural Language "Warrant" System (Technical Innovation)
Our most unique feature. Instead of a "Click to Win" button, players must write out their theory. Our **AI "Judge"** analyzes the user's input against the hidden database "Truth" to verify if the logic, motive, and evidence citations are correct.

---

## 🤖 Technical Architecture

1. **Client:** Handles the Neon-Noir UI and local game state.
2. **Express Server:** Acts as the secure bridge, protecting API keys and managing database queries.
3. **MongoDB:** Stores the "Ground Truth" for the mystery and persists evidence.
4. **GROQ AI:** Powers the NPC dialogue and evaluates the final win condition.

---

## 🛠️ Local Setup
1. **Clone the Repo:**
   ```bash
   git clone [https://github.com/aashh77/SinCity.git](https://github.com/aashh77/SinCity.git)

2. **Environment Setup:**
        Create a .env file in the /Backend directory:

        Code snippet
        PORT=8080
        MONGO_URI=your_mongodb_atlas_uri
        GROQ_API_KEY=your_GROQ_ai_key

3. **Run Application:**
        cd Backend && npm install && node server.js

🌑 THE PLOT (SPOILER WARNING)
For Evaluators Only:
