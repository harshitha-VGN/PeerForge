// ─── BattleStats.jsx ──────────────────────────────────────────────────────────
// Drop-in replacement for the Revision Queue widget on Dashboard.
// Shows: recent duels, win rate, category breakdown, rival tracking.
// Usage: <BattleStats userId={user._id} />
//
// Backend needed: GET /api/duels/mystats  (see snippet below)

import React, { useEffect, useState } from 'react';
import { Swords, TrendingUp, Target, Flame, Trophy, ExternalLink } from 'lucide-react';
import API from '../api';

// ── tiny helpers ──────────────────────────────────────────────────────────────
const diffColor = { Easy: "text-accent3", Medium: "text-accent4", Hard: "text-accent2" };
const resultColor = (won) => won ? "text-accent3" : "text-accent2";
const resultLabel = (won) => won ? "WIN" : "LOSS";

// ─── Main Widget ──────────────────────────────────────────────────────────────
const BattleStats = ({ userEmail }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get("/duels/mystats");
        setStats(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-surface2 rounded w-1/3 mb-4"/>
      <div className="h-20 bg-surface2 rounded"/>
    </div>
  );

  if (!stats) return null;

  const { totalDuels, wins, recentDuels, categoryBreakdown, winStreak } = stats;
  const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-accent"/>
          <span className="font-head font-black uppercase text-sm tracking-widest">BATTLE STATS</span>
        </div>
        {winStreak >= 2 && (
          <span className="text-[9px] font-mono text-accent4 flex items-center gap-1 border border-accent4/20 bg-accent4/5 px-2 py-1 rounded-lg uppercase">
            <Flame size={9}/> {winStreak} streak
          </span>
        )}
      </div>

      {/* Win rate bar */}
      <div>
        <div className="flex justify-between text-[10px] font-mono text-muted uppercase mb-1.5">
          <span>Win Rate</span>
          <span className="text-white font-bold">{winRate}% · {totalDuels} duels</span>
        </div>
        <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent3 rounded-full transition-all duration-700"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Mini stat pills */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Wins", value: wins, color: "text-accent3" },
          { label: "Losses", value: totalDuels - wins, color: "text-accent2" },
          { label: "Streak", value: winStreak, color: "text-accent4" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg border border-border rounded-xl p-3 text-center">
            <div className={`text-xl font-head font-black ${color}`}>{value}</div>
            <div className="text-[9px] font-mono text-muted uppercase">{label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {categoryBreakdown?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
            <Target size={9}/> Best categories
          </div>
          <div className="flex flex-col gap-1.5">
            {categoryBreakdown.slice(0, 3).map(({ category, wins: cw, total }) => {
              const pct = total > 0 ? Math.round((cw / total) * 100) : 0;
              return (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/60 w-24 truncate">{category}</span>
                  <div className="flex-1 h-1.5 bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full" style={{ width: `${pct}%` }}/>
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
          <div className="flex flex-col gap-1">
            {recentDuels.slice(0, 4).map((duel, i) => {
              const won = duel.winner === userEmail;
              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[9px] font-mono font-black uppercase w-8 ${resultColor(won)}`}>
                      {resultLabel(won)}
                    </span>
                    <span className="text-xs text-white/70 truncate">{duel.problemTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-mono ${diffColor[duel.difficulty] || "text-muted"}`}>
                      {duel.difficulty}
                    </span>
                    <a href={`https://leetcode.com/problems/${duel.problemSlug}/`} target="_blank" rel="noreferrer"
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

      {totalDuels === 0 && (
        <div className="text-center py-4 text-muted text-xs font-mono">
          No battles yet. <a href="/duel" className="text-accent hover:underline">Start a duel!</a>
        </div>
      )}
    </div>
  );
};

export default BattleStats;

/*
─── Backend: Add this to duelController.js ──────────────────────────────────────

export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    // All completed duels this user participated in
    const duels = await Duel.find({
      participants: userId,
      status: "COMPLETED",
    }).sort({ updatedAt: -1 });

    const wins = duels.filter(d => d.winner === user.email).length;
    const totalDuels = duels.length;

    // Win streak: count consecutive wins from most recent
    let winStreak = 0;
    for (const d of duels) {
      if (d.winner === user.email) winStreak++;
      else break;
    }

    // Category breakdown
    const catMap = {};
    for (const d of duels) {
      const cat = d.category || "Random";
      if (!catMap[cat]) catMap[cat] = { wins: 0, total: 0 };
      catMap[cat].total++;
      if (d.winner === user.email) catMap[cat].wins++;
    }
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => (b.wins / b.total) - (a.wins / a.total));

    // Recent duels (last 10)
    const recentDuels = duels.slice(0, 10).map(d => ({
      problemTitle: d.problemTitle,
      problemSlug: d.problemSlug,
      difficulty: d.difficulty,
      category: d.category,
      winner: d.winner,
    }));

    res.json({ totalDuels, wins, winStreak, categoryBreakdown, recentDuels });
  } catch (err) {
    res.status(500).json({ message: "Stats error" });
  }
};

// Route: router.get("/mystats", getMyStats);  — add to duelRoutes.js
*/