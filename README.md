# PeerForge 🥷

> **Competitive coding, collaborative learning — all in one place.**

PeerForge is a full-stack web platform that transforms solo LeetCode grinding into a social experience. Challenge peers to real-time coding duels, form study pods, track your progress with spaced repetition, and climb the leaderboard.

---

## ✨ Features

### ⚔️ Duel System
- Create a **live coding duel room** with a real LeetCode problem fetched via GraphQL API
- Filter problems by category (Arrays, Strings, DP, Graphs, etc.)
- Challenger requests to join → host accepts/rejects
- Verify your solve directly against LeetCode's submission history — no honor system
- Smart quit logic: if you leave mid-match, opponent can still earn points; solved players exit freely
- Lobby shows only rooms you can join — locks out completed/ongoing rooms automatically
- Duel wins earn **Focus Coins** and **XP**

### 🧑‍🤝‍🧑 Study Pods
- Create collaborative project pods with tech stack tags and project description
- Pod join requests with intro messages — creator reviews applicant profile before accepting
- Rejection notifications with reason shown on the rejected user's card
- Real-time group chat for pod members
- Creator closes pod with a **project link** → pod graduates to the Hall of Fame leaderboard
- Search and filter pods by tech stack or project tags (Beginner Friendly, Open Source, Hackathon, MVP, etc.)

### 🔁 Revision Queue (Spaced Repetition)
- Problems you solve in duels are auto-added to your revision queue
- SM-2 spaced repetition algorithm — same system used by Anki
- Rate each review: Again / Hard / Good / Easy — due dates adjust accordingly
- Library view shows all saved problems with ease factor and review count

### 🏆 Leaderboard
- **Players tab** — ranked by Focus Coins (streak as tiebreaker), medals for top 3
- **Pods Hall of Fame** — closed pods with their tech stack, team, and project links

### 📊 Dashboard
- Live streak tracker with freeze mechanic
- Focus Coins, Duel Wins, and XP stat cards
- My Pods widget with member count and pending request badges
- Battle Stats with recent duel history
- Quick Duel entry shortcut

### 👤 Profile
- Link your LeetCode username for solve verification
- Set your DSA level, current status, years of experience, tech stack
- Add project portfolio entries with links
- Public profile visible to pod creators when reviewing join requests

### 🔐 Auth
- JWT-based authentication with bcrypt password hashing
- Protected routes throughout

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| Lucide React | Icons |

### Backend
| Tech | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database + ODM |
| JWT + bcryptjs | Auth + password hashing |
| Axios | LeetCode GraphQL API calls |
| date-fns | Date utilities for streak logic |
| Socket.io | (installed, for future real-time upgrades) |

### External API
- **LeetCode GraphQL API** — fetches real problems by tag, verifies accepted submissions by username

---

## 📁 Project Structure

```
CodeBuddy/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # Register, login, profile update
│   │   ├── duelController.js       # Full duel lifecycle + LeetCode verify
│   │   ├── podController.js        # Pod CRUD, requests, leave, close
│   │   ├── progressController.js   # Daily streak check-in logic
│   │   ├── economyController.js    # Leaderboard queries
│   │   └── reviewController.js     # Spaced repetition SM-2
│   ├── models/
│   │   ├── User.js                 # User schema with profile fields
│   │   ├── Duel.js                 # Duel rooms, results, abandon tracking
│   │   ├── Pod.js                  # Pods, messages, requests, rejections
│   │   ├── ReviewCard.js           # SM-2 review card per problem
│   │   └── Progress.js             # Daily check-in records
│   ├── routes/
│   │   ├── auth.js
│   │   ├── duel.js
│   │   ├── podRoutes.js
│   │   ├── progress.js
│   │   ├── economy.js
│   │   └── reviewRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT verification
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.js
        │   ├── DuelLobby.js
        │   ├── DuelRoom.js
        │   ├── Pods.js
        │   ├── Leaderboard.js
        │   ├── Review.js
        │   ├── Profile.js
        │   └── Auth.js
        └── api.js                  # Axios instance with auth header
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- A LeetCode account (for duel verification)

### 1. Clone the repo
```bash
git clone https://github.com/harshitha-VGN/PeerForge.git
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/codebuddy
BCRYPT_SALT_ROUNDS=choose_a_number
JWT_SECRET=your_super_secret_key_here

```

Start the backend:
```bash
npm start
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm start
```

App runs on `http://localhost:3000`, API on `http://localhost:5001`.

---

## 🎮 How to Use

### Starting a Duel
1. Go to **Duel** → select a category → click **Create Duel**
2. Wait in your room for a challenger to appear
3. Accept or reject challengers
4. Once matched, both players see the LeetCode problem
5. Solve it on LeetCode, come back and click **"I've Got an Accepted Status"**
6. The system verifies your submission timestamp against match start time
7. Fastest verified solve wins 🏆

### Joining a Duel
1. Go to **Duel** → find an open room → click **Join**
2. Wait for host approval
3. Once accepted, start solving!

### Study Pods
1. **Launch Pod** → fill in title, idea, tech stack, tags, max members
2. Other users request to join with an intro message
3. Creator reviews and accepts/rejects (with reason)
4. Members chat in real-time
5. When project is done, creator clicks **Close Pod** → adds project link → moves to Hall of Fame

---

## 🧠 Streak Rules
Claim your daily streak by completing **at least one** of:
- ✅ Complete all due revision cards for today
- ✅ Verify a duel solve today

---




