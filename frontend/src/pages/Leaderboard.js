import React, { useEffect, useState } from 'react';
import API from '../api';
import { Trophy, Swords, Layers, ExternalLink, Flame, Coins, Award, Users } from 'lucide-react';

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-xs font-bold text-gray-400">#{rank}</span>;
};

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [closedPods, setClosedPods] = useState([]);
  const [tab, setTab] = useState('users'); // 'users' | 'pods'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, podsRes] = await Promise.all([
          API.get('/economy/leaderboard'),
          API.get('/pods/closed'),
        ]);
        setUsers(usersRes.data);
        setClosedPods(podsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const topThree = users.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent4/10 border border-accent4/20 text-accent4 text-xs font-semibold mb-3">
              <Trophy size={14} />
              <span>PeerForge Hall of Fame</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Leaderboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Top performing engineers ranked by Focus Coins, Duel Victories, and Active Streaks.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-[#14141a] border border-[#2a2a38] rounded-xl p-1 self-start sm:self-auto">
            <button
              onClick={() => setTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                tab === 'users'
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Swords size={14} />
              <span>Top Players</span>
            </button>
            <button
              onClick={() => setTab('pods')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                tab === 'pods'
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Pods Hall of Fame</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-accent text-sm font-semibold animate-pulse">
            Loading rankings...
          </div>
        ) : tab === 'users' ? (
          <div className="space-y-8">
            {/* Top 3 Podium Highlights (if players exist) */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topThree.map((user, idx) => {
                  const rank = idx + 1;
                  const borderClass = 
                    rank === 1 ? 'border-amber-400/30 bg-gradient-to-b from-amber-400/10 to-[#14141a]' :
                    rank === 2 ? 'border-slate-300/30 bg-gradient-to-b from-slate-300/10 to-[#14141a]' :
                    'border-amber-700/30 bg-gradient-to-b from-amber-700/10 to-[#14141a]';

                  return (
                    <div 
                      key={user._id} 
                      className={`relative border rounded-2xl p-6 flex flex-col items-center text-center shadow-xl transition-all duration-200 hover:border-[#3a3a4c] ${borderClass}`}
                    >
                      <div className="absolute top-4 right-4">
                        <RankBadge rank={rank} />
                      </div>

                      <div className="w-14 h-14 rounded-2xl bg-[#0c0c0f] border border-[#2a2a38] flex items-center justify-center text-lg font-bold text-white mb-3 shadow-md">
                        {user.email[0].toUpperCase()}
                      </div>

                      <h3 className="text-base font-bold text-white truncate max-w-[180px]">
                        {user.email.split('@')[0]}
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">{user.dsaLevel || 'Engineer'}</p>

                      <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-[#2a2a38]/60 text-center">
                        <div>
                          <div className="text-xs font-bold text-accent4 flex items-center justify-center gap-1">
                            <Coins size={12} /> {user.focusCoins}
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">Coins</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-orange-400 flex items-center justify-center gap-1">
                            <Flame size={12} /> {user.streak}
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">Streak</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-accent3 flex items-center justify-center gap-1">
                            <Swords size={12} /> {user.duelWins || 0}
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">Wins</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Complete Users Table */}
            <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl shadow-xl overflow-hidden">
              <div className="p-5 border-b border-[#2a2a38]/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Award size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Global Player Standings</h2>
                    <p className="text-xs text-gray-400">All registered developers</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-[#0c0c0f] px-3 py-1.5 rounded-lg border border-[#2a2a38]">
                  {users.length} Developers
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0c0c0f]/80 text-gray-400 text-xs font-semibold border-b border-[#2a2a38]">
                      <th className="py-3.5 px-6 w-16">Rank</th>
                      <th className="py-3.5 px-6">Developer</th>
                      <th className="py-3.5 px-6 text-right">Focus Coins</th>
                      <th className="py-3.5 px-6 text-right">Streak</th>
                      <th className="py-3.5 px-6 text-right">Duel Wins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a38]/40 text-sm">
                    {users.map((user, index) => (
                      <tr
                        key={user._id}
                        className={`transition hover:bg-white/[0.02] ${
                          index < 3 ? 'bg-white/[0.01]' : ''
                        }`}
                      >
                        <td className="py-4 px-6 font-medium">
                          <RankBadge rank={index + 1} />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0c0c0f] border border-[#2a2a38] flex items-center justify-center font-bold text-xs text-white">
                              {user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{user.email.split('@')[0]}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent4/10 text-accent4 border border-accent4/20">
                            <Coins size={12} /> {user.focusCoins}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <Flame size={12} /> {user.streak} days
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent3/10 text-accent3 border border-accent3/20">
                            <Swords size={12} /> {user.duelWins || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                          No players registered yet. Be the first to join!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* PODS HALL OF FAME */
          <div className="space-y-4">
            {closedPods.length === 0 ? (
              <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-16 text-center shadow-xl">
                <Layers size={40} className="mx-auto text-gray-600 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No completed pods yet</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Team up with fellow developers, build an MVP, and submit it to be enshrined here!
                </p>
              </div>
            ) : (
              closedPods.map((pod, index) => (
                <div 
                  key={pod._id} 
                  className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-7 shadow-xl transition-all duration-200 hover:border-[#3a3a4c]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-base shrink-0">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          {pod.title}
                        </h3>
                        <p className="text-xs text-gray-400 italic mb-3">"{pod.idea}"</p>

                        {/* Tech stack badges */}
                        {pod.techStack?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {pod.techStack.map(t => (
                              <span 
                                key={t} 
                                className="px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 rounded-lg text-xs font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Members */}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Users size={14} className="text-gray-500" />
                          <span className="font-semibold text-gray-400">Team:</span>
                          <div className="flex flex-wrap gap-1">
                            {pod.members?.slice(0, 4).map(m => (
                              <span key={m._id} className="bg-[#0c0c0f] px-2 py-0.5 rounded-md border border-[#2a2a38] text-gray-300 font-medium">
                                {m.email?.split('@')[0]}
                              </span>
                            ))}
                            {pod.members?.length > 4 && (
                              <span className="text-gray-500">+{pod.members.length - 4} more</span>
                            )}
                          </div>
                        </div>

                        {pod.closedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Completed on {new Date(pod.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {pod.projectLink && (
                      <a
                        href={pod.projectLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-xs font-semibold hover:bg-accent/90 transition shadow-lg shadow-accent/20 whitespace-nowrap self-start"
                      >
                        <span>View Project</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
