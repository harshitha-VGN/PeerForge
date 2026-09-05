# PeerForge 🥷

> **Competitive coding, collaborative learning — all in one place.**

PeerForge is a full-stack platform that transforms solo LeetCode grinding into a competitive, real-time social ecosystem. Challenge peers to live 1v1 coding duels verified via the LeetCode GraphQL API, form Study Pods for team projects with real-time push chat, and retain problem patterns permanently with SM-2 spaced repetition.

---

## ✨ Core Systems


### ⚔️ Real-Time 1v1 Duel Engine (Socket.IO)
- **Live Matchmaking & Lobby:** Create or join duel rooms categorized by topic (DP, Graphs, Trees, Arrays, etc.) with real-time Socket.io push notifications (zero polling).
- **LeetCode GraphQL Integration:** Real problems fetched live via LeetCode's GraphQL API.
- **Automated Timestamp-Anchored Referee:** Verifies solves directly against LeetCode's `recentAcSubmissionList` API within a clock-skew tolerant window.
- **Concurrency & Anti-Cheat:** Atomic document locking (`findOneAndUpdate`) guarantees accurate winner assignment, prevents double joins, and handles opponent abandonment gracefully.
- **Reward Economy:** Match wins award **50 Focus Coins** and **100 XP**, and automatically add the problem to your revision queue.

### 🧑‍🤝‍🧑 Study Pods (Collaborative Projects)
- **Team Incubation:** Launch project pods with customized tech stacks, project briefs, and member limits.
- **Creator-Gated Applications:** Review applicant DSA levels and experience before accepting or rejecting with personalized feedback.
- **Real-Time Push Chat:** Sub-50ms message delivery via dedicated Socket.io pod channels.
- **Hall of Fame:** Completed pods graduate to the Hall of Fame with live GitHub/demo links.

### 🔁 SM-2 Spaced Repetition Queue
- **Automated Card Generation:** Every solved duel problem creates a revision card.
- **Adaptive SM-2 Algorithm:** SuperMemo-2 mathematical scheduling adjusts review dates according to user recall difficulty ratings (Again / Hard / Good / Easy).
- **Retention Forecast:** Interactive dashboard displays due cards and upcoming 7-day review projections.

### 🔐 Enterprise Dual-Token Authentication
- **Short-Lived Access Tokens (15m):** Passed in Authorization header.
- **Long-Lived Refresh Tokens (7d):** Stored securely in `httpOnly`, `SameSite=Strict`, `Secure` cookies (100% immune to XSS token theft).
- **Silent Refresh Interceptor:** Axios response interceptor queues concurrent requests during token renewal so user sessions never unexpectedly drop.

### 🏆 Gated Gamification & Leaderboard
- **Anti-Cheat Streak Gate:** Daily streak check-in is strictly locked behind completing your due SM-2 revision queue or winning a duel.
- **Streak Freeze Protection:** Purchasable via earned Focus Coins (50 coins) with atomic anti-double-spend guarantees.
- **Live Leaderboard:** Top 50 ranked by Focus Coins and streak count.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TailwindCSS, Socket.io-Client, Axios (with auto-refresh interceptors), Lucide Icons |
| **Backend** | Node.js, Express 5, Socket.io Server, Cookie-Parser, JWT, BcryptJS, Date-Fns |
| **Database** | MongoDB Atlas with Mongoose (Atomic concurrency operators) |
| **External API** | LeetCode GraphQL API |

---

## 📁 Architecture & File Layout

```
peer_forge/
├── backend/
│   ├── config/db.js             # Mongoose database connection
│   ├── socket.js                # Centralized Socket.io room & event hub
│   ├── controllers/
│   │   ├── authController.js    # Dual-token auth, refresh rotation, logout
│   │   ├── duelController.js    # Atomic duel state machine & LC referee
│   │   ├── podController.js     # Pod lifecycle, atomic requests, push chat
│   │   ├── progressController.js# Daily streak check-in & gate validation
│   │   ├── economyController.js # Atomic coin spending & leaderboard
│   │   └── reviewController.js  # SM-2 spaced repetition engine
│   ├── models/
│   │   ├── User.js              # User identity, streak, coins, profile
│   │   ├── Duel.js              # Match room, results, participants
│   │   ├── Pod.js               # Study pod, embedded messages, requests
│   │   ├── ReviewCard.js        # SM-2 card with compound unique index
│   │   └── Progress.js          # Streak check-in log
│   ├── routes/                  # Express route definitions
│   ├── middleware/
│   │   └── authMiddleware.js    # Access token verification
│   └── server.js                # Express & Socket.io server boot
│
└── frontend/
    └── src/
        ├── api.js               # Axios instance with silent refresh queue
        ├── socket.js            # Socket.io client instance
        └── pages/
            ├── Dashboard.js     # User statistics, streak, review widget
            ├── DuelLobby.js     # Real-time room discovery & creation
            ├── DuelRoom.js      # Real-time war room & solve referee
            ├── Pods.js          # Real-time study pod hub & group chat
            ├── Review.js        # Spaced repetition card review session
            ├── Leaderboard.js   # Global player rankings & Hall of Fame
            ├── Profile.js       # LeetCode handle & portfolio management
            └── Auth.js          # Login & registration interface
```

---

## 🚀 Quickstart

### 1. Backend Setup
```bash
cd backend
npm install
```

Create `.env` in `backend/`:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Start the backend:
```bash
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` in your browser.
