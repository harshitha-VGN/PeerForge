import React, { useEffect, useState } from 'react';
import API from '../api';
import {
  Flame, Swords, ExternalLink,
  Layers, ChevronRight, Users, Bell, Sparkles, ArrowRight, Zap, Coins, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const diffColor = {
  Easy: "text-accent3 bg-accent3/10 border-accent3/20",
  Medium: "text-accent4 bg-accent4/10 border-accent4/20",
  Hard: "text-accent2 bg-accent2/10 border-accent2/20",
};

const StatCard = ({ icon, label, value, colorBg, colorText, sub }) => (
  <div className="bg-[#14141a] border border-[#2a2a38] p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-[#3a3a4c] transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorBg} ${colorText}`}>
        {icon}
      </div>
      {sub && <span className="text-xs text-gray-400 font-medium">{sub}</span>}
    </div>
    <div>
      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

// ─── Battle Stats Widget ──────────────────────────────────────────────────────
const BattleStats = ({ userEmail }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/duels/mystats')
      .then(r => setStats(r.data))
      .catch(e => console.error('Stats fetch failed:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-3 animate-pulse py-4">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#0c0c0f] rounded-xl" />)}
    </div>
  );

  if (!stats || stats.totalDuels === 0) return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-3">
        <Swords size={24} />
      </div>
      <p className="text-gray-400 text-sm font-medium">No duels played yet.</p>
      <button 
        onClick={() => navigate('/duel')}
        className="mt-4 text-accent text-xs font-bold hover:underline uppercase tracking-wider flex items-center gap-1.5 mx-auto"
      >
        Enter War Room <ArrowRight size={13} />
      </button>
    </div>
  );

  const { totalDuels, wins, recentDuels, categoryBreakdown, winStreak } = stats;
  const losses = totalDuels - wins;
  const winRate = Math.round((wins / totalDuels) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Win rate progress */}
      <div>
        <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <span>Win Rate</span>
          <span className="text-white font-bold">{winRate}% ({wins}W - {losses}L)</span>
        </div>
        <div className="w-full h-2.5 bg-[#0c0c0f] border border-[#2a2a38]/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accent to-accent3 rounded-full transition-all duration-700"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Wins", value: wins, color: "text-accent3" },
          { label: "Losses", value: losses, color: "text-accent2" },
          { label: "Win Streak", value: winStreak, color: "text-accent4", suffix: winStreak >= 2 ? " 🔥" : "" },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="bg-[#0c0c0f] border border-[#2a2a38] rounded-xl p-3.5 text-center">
            <div className={`text-xl font-extrabold ${color}`}>{value}{suffix}</div>
            <div className="text-[11px] font-medium text-gray-400 uppercase mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {categoryBreakdown?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent" /> Strongest Topics
          </div>
          <div className="space-y-2">
            {categoryBreakdown.slice(0, 3).map(({ category, wins: cw, total }) => {
              const pct = total > 0 ? Math.round((cw / total) * 100) : 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-300 w-28 truncate">{category}</span>
                  <div className="flex-1 h-2 bg-[#0c0c0f] rounded-full overflow-hidden border border-[#2a2a38]/40">
                    <div className="h-full bg-accent/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Duels */}
      {recentDuels?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Matches</div>
          <div className="divide-y divide-[#2a2a38]/60">
            {recentDuels.slice(0, 4).map((duel, i) => {
              const won = duel.winner === userEmail;
              return (
                <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                      won ? "text-accent3 bg-accent3/10 border-accent3/20" : "text-accent2 bg-accent2/10 border-accent2/20"
                    }`}>
                      {won ? "WIN" : "LOSS"}
                    </span>
                    <span className="text-sm text-gray-200 truncate font-medium">{duel.problemTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${diffColor[duel.difficulty] || ""}`}>
                      {duel.difficulty}
                    </span>
                    <a 
                      href={`https://leetcode.com/problems/${duel.problemSlug}/`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-gray-400 hover:text-accent transition p-1"
                    >
                      <ExternalLink size={13} />
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

// ─── Pod Stats Widget ─────────────────────────────────────────────────────────
const PodStats = () => {
  const [myPods, setMyPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/pods/mine')
      .then(r => setMyPods(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-3 py-4">
      {[1, 2].map(i => <div key={i} className="h-14 bg-[#0c0c0f] rounded-xl" />)}
    </div>
  );

  if (myPods.length === 0) return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-accent2/10 border border-accent2/20 flex items-center justify-center text-accent2 mx-auto mb-3">
        <Layers size={24} />
      </div>
      <p className="text-gray-400 text-sm font-medium">Not participating in any pods.</p>
      <button 
        onClick={() => navigate('/pods')}
        className="mt-4 text-accent text-xs font-bold hover:underline uppercase tracking-wider flex items-center gap-1.5 mx-auto"
      >
        Discover Pods <ArrowRight size={13} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {myPods.map(pod => {
        const pendingCount = pod.pendingRequests?.length || 0;

        return (
          <div 
            key={pod._id}
            onClick={() => navigate('/pods')}
            className="p-4 bg-[#0c0c0f] border border-[#2a2a38] rounded-xl flex items-center gap-3.5 cursor-pointer hover:border-accent/40 transition-all group"
          >
            <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center font-bold text-accent text-sm shrink-0">
              {pod.title[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white truncate group-hover:text-accent transition">{pod.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={11} /> {pod.members?.length || 1} members
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  pod.status === 'FULL' ? 'bg-accent2/10 text-accent2 border border-accent2/20' : 'bg-accent3/10 text-accent3 border border-accent3/20'
                }`}>
                  {pod.status}
                </span>
              </div>
            </div>

            {pendingCount > 0 && (
              <span className="flex items-center gap-1 bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                <Bell size={10} /> {pendingCount}
              </span>
            )}

            <ChevronRight size={16} className="text-gray-500 group-hover:text-accent transition shrink-0" />
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(err => console.error(err));
  }, []);

  const handleCheckIn = async () => {
    try {
      await API.post('/progress/checkin');
      alert('Streak Claimed! 🔥 Keep up the momentum.');
      window.location.reload();
    } catch (e) {
      alert(e.response?.data?.message || 'Complete today’s revision queue or win a duel before claiming your streak!');
    }
  };

  if (!user) return (
    <div className="p-20 text-center animate-pulse text-sm font-medium text-accent flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <span>Loading Command Center...</span>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto text-gray-100 font-sans">
      {/* Welcome Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Welcome back, <span className="text-accent">{user.displayName || user.email.split('@')[0]}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {user.currentStatus ? `${user.currentStatus} · ` : ''}Practice DSA, compete in duels, and retain patterns.
          </p>
        </div>
      </header>

      {/* Top 4 Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          icon={<Flame size={22} />} 
          label="Active Streak" 
          value={`${user.streak} Days`} 
          colorBg="bg-orange-500/10 border border-orange-500/20" 
          colorText="text-orange-400" 
          sub={user.hasStreakFreeze ? "🛡️ Freeze Active" : "Daily check-in ready"} 
        />
        <StatCard 
          icon={<Coins size={22} />} 
          label="Focus Coins" 
          value={`🪙 ${user.focusCoins || 0}`} 
          colorBg="bg-accent4/10 border border-accent4/20" 
          colorText="text-accent4" 
          sub="Earn 50 coins per win" 
        />
        <StatCard 
          icon={<Swords size={22} />} 
          label="Duel Victories" 
          value={user.duelWins || 0} 
          colorBg="bg-accent3/10 border border-accent3/20" 
          colorText="text-accent3" 
          sub={`${user.xp || 0} Total XP`} 
        />

        {/* Claim Streak Card */}
        <div className="relative group/streak">
          <button
            onClick={handleCheckIn}
            className="w-full h-full bg-gradient-to-tr from-accent to-purple-500 hover:from-accent hover:to-purple-600 rounded-2xl font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/25 flex flex-col items-center justify-center gap-2 p-6 min-h-[130px]"
          >
            <Zap size={26} className="text-white fill-white/20" />
            <span className="font-extrabold text-sm text-white">Claim Daily Streak</span>
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 w-72 
            bg-[#14141a] border border-[#2a2a38] rounded-2xl p-5 shadow-2xl z-50
            opacity-0 group-hover/streak:opacity-100 pointer-events-none transition-all duration-200 
            group-hover/streak:translate-y-[-6px] scale-95 group-hover/streak:scale-100">
            <p className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Streak Requirements
            </p>
            <div className="space-y-3 text-xs text-gray-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-accent3 shrink-0 mt-0.5" />
                <span>Complete all <strong>due revision cards</strong> for today.</span>
              </div>
              <div className="flex items-start gap-2.5 pt-2 border-t border-[#2a2a38]">
                <CheckCircle2 size={15} className="text-accent4 shrink-0 mt-0.5" />
                <span>Queue empty? A <strong>duel victory</strong> satisfies the gate!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Battle Stats */}
        <div className="lg:col-span-2 bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a2a38]">
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <Swords className="text-accent" size={18} /> Battle Performance
            </h3>
            <button 
              onClick={() => navigate('/duel')}
              className="text-xs font-semibold text-gray-400 hover:text-accent transition flex items-center gap-1"
            >
              Enter War Room <ChevronRight size={14} />
            </button>
          </div>
          <BattleStats userEmail={user.email} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* My Pods */}
          <div className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a2a38]">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <Layers className="text-accent2" size={18} /> My Study Pods
              </h3>
              <button 
                onClick={() => navigate('/pods')}
                className="text-xs font-semibold text-gray-400 hover:text-accent transition flex items-center gap-1"
              >
                All Pods <ChevronRight size={14} />
              </button>
            </div>
            <PodStats />
          </div>

          {/* Quick Duel CTA */}
          <div className="bg-gradient-to-br from-accent/15 via-[#14141a] to-[#14141a] border border-accent/30 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <Swords size={16} />
              </div>
              <h3 className="text-base font-bold text-white">Live 1v1 Duels</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Challenge peers to real LeetCode problems verified automatically. Earn Focus Coins and level up.
            </p>
            <button 
              onClick={() => navigate('/duel')}
              className="w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-accent/20 mt-1 active:scale-95"
            >
              Start a Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;