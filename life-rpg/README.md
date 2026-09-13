# Life RPG - Gamified Productivity Platform

Transform everyday productivity into a dark-fantasy RPG experience inspired by classic action RPG progression systems.

**Life RPG** converts real-world tasks into quests, rewarding users with **Runes (XP)** and **Echoes (Currency)**. Users can maintain productivity streaks, level up their character, acquire equipment, and challenge powerful Demigod bosses in turn-based combat.

---

## Key Features

### Quest & Progression System
- **Server-authoritative quest engine** with four difficulty tiers: **Trivial, Common, Challenging, and Legendary**.
- Server-side validation of **XP and currency calculations** to ensure consistent and tamper-resistant progression.
- **20-level progression system** that increases core character attributes including **Vigor (HP), Strength (Attack), and Poise (Defense)**.
- **Flame of Grace streak system** requiring users to earn at least **100 Runes per day** to maintain their streak.

### Inventory & Character Customization
- **Merchant's Vault** featuring weapons, armor, accessories, and restorative potions.
- **Pouch & Loadout Manager** supporting equipment slots for weapons, helmets, armor, and accessories.
- Dynamic character-stat recalculation based on equipped items.
- Consumable restorative elixirs that can be used during gameplay.

### World & Combat
- **Interactive SVG-based world map** featuring five original Demigod encounters.
- Boss encounters include unlock prerequisites and unique item rewards.
- **Deterministic turn-based combat engine** with server-side combat simulation.
- Animated combat playback, floating damage indicators, and retro **8-bit sound effects**.

### Achievements & Audio
- **Hall of Medallions** with 10 unlockable achievements based on quests completed, streak milestones, character progression, and boss victories.
- Integrated **Web Audio API synthesizer** providing retro sound effects for interactions, purchases, level-ups, attacks, and victories.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Web Audio API |
| **Styling** | Vanilla CSS, custom Dark Fantasy RPG design system |
| **Typography** | Press Start 2P, VT323, Cinzel |
| **Backend** | Python 3.12, FastAPI, Uvicorn (ASGI), Pydantic v2 |
| **Database** | MongoDB with Motor async driver, append-only ledger, and transaction support |
| **Authentication & Security** | JWT access tokens, HttpOnly refresh cookies, bcrypt password hashing |
| **Testing** | Pytest, pytest-asyncio |

---

## Getting Started

### Prerequisites

Ensure the following are installed before running the project:

- **Python 3.11+**
- **Node.js 18+**
- **npm**
- **MongoDB** running locally on `localhost:27017`, or a MongoDB Atlas connection string

---

## Backend Setup

Navigate to the backend directory:

```bash
cd life-rpg/backend
```

Create and activate a Python virtual environment:

```bash
python -m venv venv
```

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
source venv/bin/activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Run the backend test suite:

```bash
pytest
```

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

**API:** `http://localhost:8000`  
**Swagger / OpenAPI Documentation:** `http://localhost:8000/docs`

---

## Frontend Setup

Navigate to the frontend directory:

```bash
cd life-rpg/frontend
```

Install the required npm packages:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend application will be available at:

**`http://localhost:5173`**

The Vite development server proxies `/api` requests to the backend running on port `8000`.

---

## Testing

Run the complete backend test suite with:

```bash
cd life-rpg/backend
.\venv\Scripts\pytest -v
```

The test suite covers:

- RPG progression formulas and character-stat calculations across all 20 levels.
- Deterministic Demigod combat simulation and damage resolution.
- Password hashing and verification.
- JWT access and refresh token encoding and decoding.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account and initialize the character with starter equipment |
| `POST` | `/api/auth/login` | Authenticate a user and issue a JWT access token with a refresh cookie |
| `POST` | `/api/auth/refresh` | Rotate and refresh expired access tokens |

### Character & Progression

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/character` | Retrieve character statistics, level progression, and effective attributes |

### Quests

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/quests` | Retrieve active, completed, or all quests |
| `POST` | `/api/quests` | Create a new quest |
| `POST` | `/api/quests/{id}/complete` | Complete a quest and claim Runes and Echoes |

### Shop & Inventory

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/shop` | Browse available and locked items |
| `POST` | `/api/shop/purchase` | Purchase items using Echoes |
| `GET` | `/api/inventory` | Retrieve inventory contents and equipped loadout |
| `POST` | `/api/inventory/equip` | Equip an item and recalculate character attributes |
| `POST` | `/api/inventory/consume` | Consume a restorative potion and recover HP |

### World & Combat

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/map` | Retrieve Demigod encounters and their unlock states |
| `POST` | `/api/bosses/{id}/fight` | Initiate a turn-based Demigod battle |
| `GET` | `/api/badges` | Retrieve all achievements and their unlock status |

---

## License

**Life RPG © 2026**

Built to turn everyday productivity into a structured, rewarding RPG progression experience.
