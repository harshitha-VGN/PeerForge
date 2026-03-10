import React, { useEffect, useState } from 'react';
import API from '../api';
import {
  Zap, Trophy, Swords, TrendingUp, Target, ExternalLink,
  Layers, ChevronRight, Users, MessageSquare, Bell, Clock, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const diffColor = {
  Easy: "text-accent3 bg-accent3/10",
  Medium: "text-accent4 bg-accent4/10",
  Hard: "text-accent2 bg-accent2/10",
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="bg-surface border border-border p-6 rounded-[2rem] shadow-lg">
    <div className={`mb-3 ${color}`}>{icon}</div>
    <div className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-black font-head italic">{value}</div>
    {sub && <div className="text-[10px] text-muted font-mono mt-1">{sub}</div>}
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
    <div className="flex flex-col gap-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-10 bg-surface2 rounded-xl"/>)}
    </div>
  );

  if (!stats || stats.totalDuels === 0) return (
    <div className="py-12 text-center">
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
    <div className="flex flex-col gap-5">
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

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Wins", value: wins, color: "text-accent3" },
          { label: "Losses", value: losses, color: "text-accent2" },
          { label: "W. Streak", value: winStreak, color: "text-accent4", suffix: winStreak >= 2 ? "🔥" : "" },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="bg-bg border border-border rounded-2xl p-3 text-center">
            <div className={`text-xl font-head font-black ${color}`}>{value}{suffix}</div>
            <div className="text-[9px] font-mono text-muted uppercase mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {categoryBreakdown?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
            <Target size={9}/> Best Categories
          </div>
          {categoryBreakdown.slice(0, 3).map(({ category, wins: cw, total }) => {
            const pct = total > 0 ? Math.round((cw / total) * 100) : 0;
            return (
              <div key={category} className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-white/50 w-24 truncate">{category}</span>
                <div className="flex-1 h-1.5 bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full bg-accent/50 rounded-full" style={{ width: `${pct}%` }}/>
                </div>
                <span className="text-[9px] font-mono text-muted w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {recentDuels?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2">Recent Battles</div>
          {recentDuels.slice(0, 4).map((duel, i) => {
            const won = duel.winner === userEmail;
            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
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
                    target="_blank" rel="noreferrer" className="text-muted hover:text-accent transition">
                    <ExternalLink size={10}/>
                  </a>
                </div>
              </div>
            );
          })}
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
    <div className="animate-pulse space-y-3">
      {[1,2].map(i => <div key={i} className="h-12 bg-surface2 rounded-xl"/>)}
    </div>
  );

  if (myPods.length === 0) return (
    <div className="py-12 text-center">
      <Layers className="mx-auto text-muted/30 mb-3" size={32}/>
      <p className="text-muted font-mono text-xs uppercase tracking-widest">Not in any pods yet.</p>
      <button onClick={() => navigate('/pods')}
        className="mt-4 text-accent text-xs font-mono hover:underline uppercase tracking-widest">
        Browse pods →
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {myPods.map(pod => {
        const pendingCount = pod.pendingRequests?.length || 0;
        return (
          <div key={pod._id}
            onClick={() => navigate('/pods')}
            className="p-4 bg-bg border border-border rounded-2xl flex items-center gap-3 cursor-pointer hover:border-accent/30 transition group">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center font-black text-accent text-sm shrink-0">
              {pod.title[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white truncate group-hover:text-accent transition">{pod.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-mono text-muted flex items-center gap-1">
                  <Users size={9}/> {pod.members?.length || 1}
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold
                  ${pod.status === 'FULL' ? 'bg-accent2/10 text-accent2' : 'bg-accent3/10 text-accent3'}`}>
                  {pod.status}
                </span>
              </div>
            </div>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 bg-accent text-white text-[9px] font-black px-2 py-1 rounded-full shrink-0">
                <Bell size={9}/> {pendingCount}
              </span>
            )}
            <ChevronRight size={14} className="text-muted group-hover:text-accent transition shrink-0"/>
          </div>
        );
      })}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/auth/me').then(r => setUser(r.data)).catch(err => console.error(err));
  }, []);

  const handleCheckIn = async () => {
    try {
      await API.post('/progress/checkin');
      alert('Streak Claimed! 🔥 See you tomorrow.');
      window.location.reload();
    } catch (e) {
      alert('You have already checked in today, or you need to complete a duel first!');
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
        <p className="text-muted text-sm mt-1 font-mono">
          {user.currentStatus && `${user.currentStatus} · `}Level up every day.
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<Zap/>}    label="Streak"      value={`${user.streak} Days`}  color="text-orange-500" sub="Keep going!" />
        <StatCard icon={<Trophy/>} label="Focus Coins" value={`🪙 ${user.focusCoins}`} color="text-accent4"    sub="Win duels to earn more" />
        <StatCard icon={<Swords/>} label="Duel Wins"   value={user.duelWins}          color="text-accent3"    sub={`${user.xp} XP total`} />

        {/* Daily Streak Card — with explanation tooltip */}
        <div className="relative group/streak">
          <button
            onClick={handleCheckIn}
            className="w-full h-full bg-accent rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:scale-105 transition shadow-xl shadow-accent/20 flex flex-col items-center justify-center gap-2 p-6 min-h-[120px]"
          >
            <Zap size={24} className="text-white"/>
            <span>Claim Daily Streak</span>
          </button>

          {/* Hover tooltip */}
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#14141a] border border-[#2a2a38] rounded-2xl p-4 shadow-2xl z-20
            opacity-0 group-hover/streak:opacity-100 pointer-events-none transition-opacity duration-200">
            <p className="text-white font-bold text-xs mb-2">How to claim?</p>
            <ul className="text-[10px] text-muted font-mono space-y-1.5">
              <li>✅ Complete all due revision cards today, <span className="text-white">OR</span></li>
              <li>✅ Solve & verify a duel today</li>
              <li className="text-muted/60 pt-1">If queue is empty today, a duel win counts!</li>
            </ul>
          </div>
        </div>
        
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Battle Stats */}
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

        {/* Sidebar */}
        <div className="flex flex-col gap-6">

          {/* Pod Stats */}
          <div className="bg-surface border border-border rounded-[2.5rem] p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <h3 className="font-head font-black italic text-xl uppercase flex items-center gap-2">
                <Layers className="text-accent2" size={18}/> My Pods
              </h3>
              <button onClick={() => navigate('/pods')}
                className="text-[10px] font-mono text-muted hover:text-accent transition uppercase tracking-widest flex items-center gap-1">
                All Pods <ChevronRight size={12}/>
              </button>
            </div>
            <PodStats/>
          </div>

          {/* Quick duel */}
          <div className="bg-accent/5 border border-accent/20 rounded-[2.5rem] p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Swords className="text-accent" size={18}/>
              <h3 className="font-head font-black italic text-xl uppercase">Quick Duel</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Challenge the community. Win duels to earn Focus Coins and climb the leaderboard.
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
