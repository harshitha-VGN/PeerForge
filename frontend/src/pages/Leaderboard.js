import React, { useEffect, useState } from 'react';
import API from '../api';
import { Trophy, Swords, Layers, ExternalLink, Medal } from 'lucide-react';

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="font-mono text-muted font-black">#{rank}</span>;
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

  return (
    <div className="p-10 max-w-4xl mx-auto font-body text-white">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-head font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Trophy className="text-accent4"/> Hall of Fame
          </h1>
          <p className="text-muted text-sm mt-1 font-mono uppercase tracking-widest">
            Ranked by Focus Coins · Streak as tiebreaker
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#14141a] border border-[#2a2a38] rounded-2xl p-1 mb-8 w-fit">
        {[
          { id: 'users', label: 'Players', icon: <Swords size={13}/> },
          { id: 'pods', label: 'Pods Hall of Fame', icon: <Layers size={13}/> },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition uppercase tracking-wide
              ${tab === id ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse font-mono text-accent uppercase text-xs">Loading...</div>
      ) : tab === 'users' ? (

        // ── USERS LEADERBOARD ──────────────────────────────────────────────────
        <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0c0c0f] text-muted font-mono text-xs uppercase">
              <tr>
                <th className="p-5 w-16">Rank</th>
                <th className="p-5">User</th>
                <th className="p-5 text-right">Focus Coins</th>
                <th className="p-5 text-right">Streak</th>
                <th className="p-5 text-right hidden md:table-cell">Duel Wins</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user._id}
                  className={`border-b border-[#2a2a38]/50 transition
                    ${index === 0 ? 'bg-accent4/5' : index === 1 ? 'bg-white/[0.02]' : index === 2 ? 'bg-white/[0.01]' : 'hover:bg-white/5'}`}
                >
                  <td className="p-5">
                    <RankBadge rank={index + 1} />
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs
                        ${index === 0 ? 'bg-accent4 text-black' : index === 1 ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}>
                        {user.email[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-sm">{user.email.split('@')[0]}</span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <span className="text-accent4 font-black font-mono">🪙 {user.focusCoins}</span>
                  </td>
                  <td className="p-5 text-right">
                    <span className="text-orange-400 font-mono">🔥 {user.streak}</span>
                  </td>
                  <td className="p-5 text-right hidden md:table-cell">
                    <span className="text-accent3 font-mono">⚔️ {user.duelWins || 0}</span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-muted font-mono text-sm">
                    No players yet. Be the first!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      ) : (

        // ── PODS HALL OF FAME ──────────────────────────────────────────────────
        <div className="flex flex-col gap-4">
          {closedPods.length === 0 ? (
            <div className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-16 text-center">
              <Layers size={40} className="mx-auto text-muted/30 mb-4"/>
              <p className="text-muted font-mono text-sm uppercase tracking-widest">
                No completed pods yet. Be the first to ship a project!
              </p>
            </div>
          ) : (
            closedPods.map((pod, index) => (
              <div key={pod._id} className="bg-[#14141a] border border-[#2a2a38] rounded-3xl p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl mt-1">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div>
                      <h3 className="text-xl font-head font-black uppercase tracking-tighter text-white mb-1">
                        {pod.title}
                      </h3>
                      <p className="text-muted text-xs font-mono italic mb-3">"{pod.idea}"</p>

                      {/* Tech stack badges */}
                      {pod.techStack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {pod.techStack.map(t => (
                            <span key={t} className="text-[10px] font-mono px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded-lg">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Members */}
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                        <span>Team:</span>
                        {pod.members?.slice(0, 4).map(m => (
                          <span key={m._id} className="bg-[#0c0c0f] px-2 py-0.5 rounded-lg text-white">
                            {m.email?.split('@')[0]}
                          </span>
                        ))}
                        {pod.members?.length > 4 && (
                          <span>+{pod.members.length - 4} more</span>
                        )}
                      </div>

                      {pod.closedAt && (
                        <p className="text-[10px] text-muted font-mono mt-2">
                          Completed {new Date(pod.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {pod.projectLink && (
                    <a
                      href={pod.projectLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition shadow-lg shadow-accent/20 whitespace-nowrap"
                    >
                      View Project <ExternalLink size={12}/>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
