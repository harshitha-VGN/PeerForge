import React, { useEffect, useState } from 'react';
import API from '../api';
import { Zap, Coins, Trophy, Swords, TrendingUp, Target, Flame, ExternalLink, Layers, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffColor = {
  Easy: "text-accent3 bg-accent3/10",
  Medium: "text-accent4 bg-accent4/10",
  Hard: "text-accent2 bg-accent2/10",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-surface border border-border p-6 rounded-[2rem] shadow-lg">
    <div className={`mb-3 ${color}`}>{icon}</div>
    <div className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-black font-head italic">{value}</div>
  </div>
);

// ─── Battle Stats Widget ──────────────────────────────────────────────────────
const BattleStats = ({ userEmail }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/duels/mystats")
      .then(r => setStats(r.data))
      .catch(e => console.error("Stats fetch failed:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-10 bg-surface2 rounded-xl"/>)}
    </div>
  );

  if (!stats || stats.totalDuels === 0) return (
    <div className="py-16 text-center">
      <Swords className="mx-auto text-muted/30 mb-3" size={36}/>
      <p className="text-muted font-mono text-xs uppercase tracking-widest">No battles yet.</p>
      <button onClick={() => navigate('/duel')}
        className="mt-4 text-accent text-xs font-mono hover:underline uppercase tracking-widest">
        Start a duel →
      </button>
    </div>
  );

  const { totalDuels, wins, recentDuels, categoryBreakdown, winStreak } = stats;
  const losses = totalDuels - wins;
  const winRate = Math.round((wins / totalDuels) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Win rate */}
      <div>
        <div className="flex justify-between text-[10px] font-mono text-muted uppercase mb-2">
          <span>Win Rate</span>
          <span className="text-white font-bold">{winRate}% · {totalDuels} duels</span>
        </div>
        <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-accent3 rounded-full transition-all duration-700"
            style={{ width: `${winRate}%` }}/>
        </div>
      </div>

      {/* Pills */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Wins", value: wins, color: "text-accent3" },
          { label: "Losses", value: losses, color: "text-accent2" },
          { label: "Streak", value: winStreak, color: "text-accent4", suffix: winStreak >= 2 ? "🔥" : "" },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="bg-bg border border-border rounded-2xl p-3 text-center">
            <div className={`text-xl font-head font-black ${color}`}>{value}{suffix}</div>
            <div className="text-[9px] font-mono text-muted uppercase mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Category bars */}
      {categoryBreakdown?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
            <Target size={9}/> Best Categories
          </div>
          <div className="flex flex-col gap-2">
            {categoryBreakdown.slice(0, 3).map(({ category, wins: cw, total }) => {
              const pct = total > 0 ? Math.round((cw / total) * 100) : 0;
              return (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/50 w-24 truncate">{category}</span>
                  <div className="flex-1 h-1.5 bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent/50 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                  </div>
                  <span className="text-[9px] font-mono text-muted w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent duels */}
      {recentDuels?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2">Recent Battles</div>
          <div className="flex flex-col gap-0">
            {recentDuels.slice(0, 4).map((duel, i) => {
              const won = duel.winner === userEmail;
              return (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[9px] font-mono font-black uppercase w-8 shrink-0 ${won ? "text-accent3" : "text-accent2"}`}>
                      {won ? "WIN" : "LOSS"}
                    </span>
                    <span className="text-xs text-white/60 truncate">{duel.problemTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-mono ${diffColor[duel.difficulty] || ""} px-1.5 py-0.5 rounded`}>
                      {duel.difficulty}
                    </span>
                    <a href={`https://leetcode.com/problems/${duel.problemSlug}/`}
                      target="_blank" rel="noreferrer"
                      className="text-muted hover:text-accent transition">
                      <ExternalLink size={10}/>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(err => console.error(err));
  }, []);

  const handleCheckIn = async () => {
    // STREAK RULE: Verify XP or Duel Wins
    if (user.xp === 0 && user.duelWins === 0) {
        alert("⚠️ STREAK RULE: You must solve a problem (Duel) or earn XP today before you can claim your streak!");
        return;
    }
    try {
      await API.post('/progress/checkin');
      alert("Streak Claimed! 🔥 See you tomorrow.");
      window.location.reload();
    } catch (e) {
      alert("You have already checked in for today.");
    }
  };

  if (!user) return (
    <div className="p-20 text-center animate-pulse font-mono text-accent uppercase text-xs">
      Loading Command Center...
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-body text-white">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-head font-black italic uppercase tracking-tighter">
          Welcome, <span className="text-accent">{user.email.split('@')[0].toUpperCase()}</span>
        </h1>
      </header>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<Zap/>}    label="Streak"      value={`${user.streak} Days`} color="text-orange-500" />
        <StatCard icon={<Coins/>}  label="Focus Coins" value={user.focusCoins}       color="text-accent4" />
        <StatCard icon={<Trophy/>} label="Duel Wins"   value={user.duelWins}         color="text-accent3" />
        <button onClick={handleCheckIn}
          className="bg-accent rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:scale-105 transition shadow-xl shadow-accent/20">
          Claim Daily Streak
        </button>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Battle Stats (replaces Revision Queue) ── */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
            <h3 className="font-head font-black italic text-xl uppercase flex items-center gap-3">
              <Swords className="text-accent"/> Battle Stats
            </h3>
            <button onClick={() => navigate('/duel')}
              className="text-[10px] font-mono text-muted hover:text-accent transition uppercase tracking-widest flex items-center gap-1">
              War Room <ChevronRight size={12}/>
            </button>
          </div>
          <BattleStats userEmail={user.email}/>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-6">

          {/* Study Pod card */}
          <div className="bg-surface border border-border rounded-[2.5rem] p-8 flex flex-col gap-4">
            <h3 className="font-head font-black italic text-xl uppercase flex items-center gap-2">
              <Layers className="text-accent2" size={18}/> Study Pod
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Stay accountable with your group. Share progress and discuss approaches in real-time.
            </p>
            <button onClick={() => navigate('/pods')}
              className="w-full py-4 bg-surface2 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:border-accent/30 transition">
              Open Pod Chat
            </button>
          </div>

          {/* Quick duel CTA */}
          <div className="bg-accent/5 border border-accent/20 rounded-[2.5rem] p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Swords className="text-accent" size={18}/>
              <h3 className="font-head font-black italic text-xl uppercase">Quick Duel</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Challenge the community. Win duels to climb the leaderboard and earn Focus Coins.
            </p>
            <button onClick={() => navigate('/duel')}
              className="w-full py-4 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition shadow-lg shadow-accent/20">
              Enter War Room
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;