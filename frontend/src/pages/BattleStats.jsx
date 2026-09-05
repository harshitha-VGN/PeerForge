import React, { useEffect, useState } from 'react';
import { Swords, Target, Flame, ExternalLink, Trophy, CheckCircle2 } from 'lucide-react';
import API from '../api';

const diffColor = { 
  Easy: "text-accent3 bg-accent3/10 border-accent3/20", 
  Medium: "text-accent4 bg-accent4/10 border-accent4/20", 
  Hard: "text-accent2 bg-accent2/10 border-accent2/20" 
};

const BattleStats = ({ userEmail }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get("/duels/mystats");
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-[#2a2a38] rounded w-1/3 mb-4"/>
        <div className="h-20 bg-[#2a2a38]/60 rounded"/>
      </div>
    );
  }

  if (!stats) return null;

  const { totalDuels, wins, recentDuels, categoryBreakdown, winStreak } = stats;

  const winRate = totalDuels > 0
    ? Math.round((wins / totalDuels) * 100)
    : 0;

  return (
    <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 flex flex-col gap-5 shadow-xl transition-all duration-200 hover:border-[#3a3a4c]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2a2a38]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Swords size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Battle Statistics</h3>
            <p className="text-xs text-gray-400">Real-time duel analytics</p>
          </div>
        </div>

        {winStreak >= 2 && (
          <span className="text-xs font-semibold text-orange-400 flex items-center gap-1 border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 rounded-lg">
            <Flame size={12} /> {winStreak} Streak
          </span>
        )}
      </div>

      {/* Win rate progress bar */}
      <div>
        <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
          <span>Win Rate</span>
          <span className="text-white">
            {winRate}% ({wins} of {totalDuels} duels won)
          </span>
        </div>

        <div className="w-full h-2.5 bg-[#0c0c0f] border border-[#2a2a38] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent3 rounded-full transition-all duration-700"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Mini stat cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#0c0c0f] border border-[#2a2a38] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-accent3">{wins}</div>
          <div className="text-xs text-gray-400 font-medium">Victories</div>
        </div>
        <div className="bg-[#0c0c0f] border border-[#2a2a38] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-accent2">{totalDuels - wins}</div>
          <div className="text-xs text-gray-400 font-medium">Defeats</div>
        </div>
        <div className="bg-[#0c0c0f] border border-[#2a2a38] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-orange-400">{winStreak}</div>
          <div className="text-xs text-gray-400 font-medium">Streak</div>
        </div>
      </div>

      {/* Category performance breakdown */}
      {categoryBreakdown?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 mb-2.5 flex items-center gap-1.5">
            <Target size={14} className="text-accent" />
            <span>Top Performing Categories</span>
          </div>

          <div className="flex flex-col gap-2">
            {categoryBreakdown.slice(0, 3).map(({ category, wins: cw, total }) => {
              const pct = total > 0 ? Math.round((cw / total) * 100) : 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-xs text-gray-300 w-24 truncate font-medium">
                    {category}
                  </span>
                  <div className="flex-1 h-2 bg-[#0c0c0f] border border-[#2a2a38] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-9 text-right font-semibold">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent duel history */}
      {recentDuels?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 mb-2">
            Recent Match History
          </div>

          <div className="divide-y divide-[#2a2a38]/50">
            {recentDuels.slice(0, 4).map((duel, i) => {
              const won = duel.winner === userEmail;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      won 
                        ? 'bg-accent3/10 text-accent3 border-accent3/20' 
                        : 'bg-accent2/10 text-accent2 border-accent2/20'
                    }`}>
                      {won ? 'WIN' : 'LOSS'}
                    </span>
                    <span className="text-xs text-gray-300 truncate font-medium">
                      {duel.problemTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${diffColor[duel.difficulty] || "text-gray-400 bg-gray-800/40 border-gray-700"}`}>
                      {duel.difficulty}
                    </span>
                    <a
                      href={`https://leetcode.com/problems/${duel.problemSlug}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-500 hover:text-accent transition p-1"
                    >
                      <ExternalLink size={12}/>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalDuels === 0 && (
        <div className="text-center py-4 text-gray-400 text-xs">
          No battles completed yet.{' '}
          <a href="/duel" className="text-accent hover:underline font-semibold">
            Enter Duel Lobby
          </a>
        </div>
      )}
    </div>
  );
};

export default BattleStats;