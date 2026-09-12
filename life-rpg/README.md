# 👑 Life RPG — Dark Fantasy Gamified Productivity

> Transform your daily routines into an Elden Ring–inspired dark fantasy RPG progression. Inscribe real quests, gather Runes (XP) and Echoes (Currency), maintain your Flame of Grace streak, forge legendary armor, and vanquish the Demigods in turn-based combat.

---

## 🌟 Key Features

- **📜 Server-Authoritative Quest Engine**: Inscribe tasks across 4 difficulty tiers (*Trivial*, *Common*, *Challenging*, *Legendary*). XP and currency calculations are securely verified server-side.
- **🔥 Flame of Grace (Streak Tracking)**: Maintain your daily streak by meeting the 100-Rune daily fuel threshold.
- **👑 Grace Ascension (Leveling System)**: 20 levels of progression scaling your character's Vigor (HP), Strength (Attack Power), and Poise (Defense).
- **🏛️ Merchant's Vault (RPG Shop)**: Acquire weapons, armor, accessories, and restorative potions that dynamically enhance your combat attributes.
- **🎒 Pouch & Loadout Manager**: Equip weapon, helmet, armor, and accessory slots, and consume restorative elixirs in real-time.
- **🗺️ The Lands Between (Interactive World Map)**: SVG-powered map pinning 5 original Demigod boss encounters with prerequisites and item drops.
- **⚔️ Turn-Based Boss Combat Arena**: Deterministic server-simulated combat with animated turn playback, floating damage numbers, and authentic 8-bit sound effects.
- **🏅 Hall of Medallions (Badges)**: 10 unlockable achievements recognizing quest volume, streaks, levels, and boss triumphs.
- **🔊 Web Audio 8-Bit Synthesizer**: Built-in retro SFX for button clicks, level-ups, combat hits, purchases, and victories.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Web Audio API |
| **Styling** | Vanilla CSS + Dark Fantasy RPG Design System (Press Start 2P, VT323, Cinzel) |
| **Backend** | Python 3.12, FastAPI, Uvicorn (ASGI), Pydantic v2 |
| **Database** | MongoDB (via Motor async driver) with append-only ledger & transaction support |
| **Security** | JWT (access tokens in-memory + HttpOnly refresh cookies), bcrypt hashing |
| **Testing** | Pytest, pytest-asyncio |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- MongoDB running locally on `localhost:27017` (or MongoDB Atlas connection string)

---

### 2. Backend Setup

```bash
cd life-rpg/backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run backend unit tests
pytest

# Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

The backend will start at: `http://localhost:8000`  
Interactive API Docs (Swagger): `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd life-rpg/frontend

# Install npm packages
npm install

# Start Vite development server (proxies /api to localhost:8000)
npm run dev
```

The frontend application will be live at: `http://localhost:5173`

---

## 🧪 Testing

Run backend test suite with Pytest:

```bash
cd life-rpg/backend
.\venv\Scripts\pytest -v
```

Tests cover:
- RPG engine level formulas and stat computations across all 20 levels
- Deterministic boss combat simulation and damage resolution
- Password hashing, verification, and JWT access/refresh token encoding/decoding

---

## 📜 API Reference Summary

- `POST /api/auth/register` — Create account, initialize character & starter gear
- `POST /api/auth/login` — Authenticate and receive JWT access token + refresh cookie
- `POST /api/auth/refresh` — Rotate and refresh expired access tokens
- `GET /api/character` — Retrieve character stats, level progress, and effective attributes
- `GET /api/quests` — List active, completed, or all quests
- `POST /api/quests` — Inscribe a new quest
- `POST /api/quests/{id}/complete` — Complete quest and claim Runes & Echoes
- `GET /api/shop` — Browse available and locked items in Merchant's Vault
- `POST /api/shop/purchase` — Purchase items with Echoes
- `GET /api/inventory` — View pouch items and active equipment loadout
- `POST /api/inventory/equip` — Equip weapon/armor/accessory and recompute stats
- `POST /api/inventory/consume` — Quaff potion and restore HP
- `GET /api/map` — Retrieve all bosses and unlock states on the World Map
- `POST /api/bosses/{id}/fight` — Challenge a Demigod in turn-based combat
- `GET /api/badges` — View all achievements and unlock status

---

## 🏛️ License

Life RPG &copy; 2026. Built with honor and grit for productive Tarnished everywhere.
