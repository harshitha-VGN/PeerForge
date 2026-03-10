import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, XCircle, Trophy, Loader2, Plus, AlertCircle, Timer, UserX } from 'lucide-react';
import API from '../api';

const DuelRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [user, setUser] = useState(null);
  const [duel, setDuel] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);

  const userRef = useRef(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);
  const duelRef = useRef(null); // track previous duel to detect changes

  const fetchStatus = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !mountedRef.current) return;

    try {
      const { data } = await API.get(`/duels/status/${roomId}`);
      if (!mountedRef.current) return;

      const myId = currentUser._id?.toString();
      const creatorId = (data.creator?._id || data.creator)?.toString();
      const pendingId = (data.pendingOpponent?._id || data.pendingOpponent)?.toString();
      const isParticipant = data.participants?.some(p => (p._id || p)?.toString() === myId);
      const isPending = pendingId === myId;

      // Only redirect to lobby if: WAITING + not creator + not participant + not pending + we already had duel loaded (rejected)
      if (data.status === 'WAITING' && myId !== creatorId && !isParticipant && !isPending) {
        if (duelRef.current !== null) {
          // Navigate with rejection state so DuelLobby can show the toast
          navigateRef.current('/duel', { state: { rejected: true, problemTitle: duelRef.current.problemTitle } });
          return;
        }
      }

      // Detect opponent left
      if (data.status === 'ONGOING') {
        const opponentParticipant = data.participants?.find(p => (p._id || p)?.toString() !== myId);
        const opponentIdStr = (opponentParticipant?._id || opponentParticipant)?.toString();
        if (opponentIdStr && data.abandonedBy?.some(a => (a._id || a)?.toString() === opponentIdStr)) {
          setOpponentLeft(true);
        }
      }

      duelRef.current = data;
      setDuel(data);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err.response?.status === 404) navigateRef.current('/duel');
    }
  }, [roomId]);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      try {
        const res = await API.get('/auth/me');
        if (!mountedRef.current) return;
        userRef.current = res.data;
        setUser(res.data);
        await fetchStatus();
        intervalRef.current = setInterval(fetchStatus, 3000);
      } catch {
        if (mountedRef.current) navigateRef.current('/login');
      }
    };
    init();
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  const myId = user?._id?.toString();
  const hostId = (duel?.creator?._id || duel?.creator)?.toString();
  const hostEmail = duel?.creatorEmail || duel?.creator?.email;
  const challenger = duel?.participants?.find(p => (p._id || p)?.toString() !== hostId);
  const challengerId = (challenger?._id || challenger)?.toString() || (duel?.pendingOpponent?._id || duel?.pendingOpponent)?.toString();
  const challengerEmail = challenger?.email || duel?.pendingOpponent?.email;

  const hasUserSolved = (targetId) => {
    if (!duel?.results || !targetId) return false;
    return duel.results.some(r => (r.user?._id || r.user)?.toString() === targetId);
  };
  const getSolveTime = (targetId) => {
    const res = duel?.results?.find(r => (r.user?._id || r.user)?.toString() === targetId);
    return res ? res.timeTaken : null;
  };

  const amIHost = myId === hostId;
  const iHaveSolved = hasUserSolved(myId);

  const handleAccept = async () => {
    try { await API.post(`/duels/accept/${roomId}`); fetchStatus(); }
    catch { alert('Accept failed'); }
  };

  const handleReject = async () => {
    if (window.confirm('Reject this challenger? Room reopens for others.')) {
      try { await API.post(`/duels/reject/${roomId}`); fetchStatus(); }
      catch { alert('Reject failed'); }
    }
  };

  const handleVerify = async () => {
    if (!user?.leetcodeUsername) return alert('Please link your LeetCode handle in Profile first!');
    setIsFinishing(true);
    try {
      const res = await API.post('/duels/verify', { leetcodeUsername: user.leetcodeUsername, roomId });
      alert(res.data.message);
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
    } finally { setIsFinishing(false); }
  };

  const handleQuit = async () => {
    // ── Smart quit message based on situation ──────────────────────────────────
    let msg;
    if (iHaveSolved) {
      msg = 'Exit room? Your win is already recorded ✓';
    } else if (opponentLeft) {
      // Opponent already abandoned — no risk to the user
      msg = 'Exit room? Opponent already left — no penalty for you.';
    } else {
      msg = 'Quit match? Opponent can still solve and earn points if you leave.';
    }

    if (!window.confirm(msg)) return;
    try { await API.post(`/duels/end/${roomId}`); } catch {}
    navigateRef.current('/duel');
  };

  if (!duel || !user) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] flex flex-col items-center justify-center font-mono text-accent uppercase text-xs tracking-widest">
        <Loader2 className="animate-spin mb-4" size={32} />
        Syncing Battle Sequence...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-body text-white min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-accent2/10 p-3 rounded-xl border border-accent2/20 text-accent2"><Swords /></div>
          <h1 className="text-2xl font-head font-black italic uppercase tracking-tighter">
            WAR ROOM: <span className="text-accent2">
              {duel.status === 'ONGOING' || duel.status === 'COMPLETED' ? duel.problemTitle : '???'}
            </span>
          </h1>
        </div>
        <button onClick={handleQuit} className="text-[10px] font-mono text-muted hover:text-accent2 border border-border px-6 py-2 rounded-xl transition uppercase tracking-widest flex items-center gap-2">
          <XCircle size={14} /> {iHaveSolved || opponentLeft ? 'Exit Room' : 'Quit Duel'}
        </button>
      </div>

      {/* Opponent left banner */}
      {opponentLeft && duel.status === 'ONGOING' && (
        <div className="mb-8 bg-accent4/10 border border-accent4/30 rounded-2xl p-5 flex items-center gap-4">
          <UserX className="text-accent4 shrink-0" size={20} />
          <div>
            <p className="font-black text-accent4 text-sm uppercase">Opponent left the match!</p>
            <p className="text-muted text-xs font-mono mt-0.5">
              {iHaveSolved ? 'You already solved — exit freely.' : 'Submit your solution to claim the win.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* CENTER STAGE */}
        <div className="bg-surface border border-border p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center text-center min-h-[480px]">

          {duel.status === 'WAITING' && (
            <div className="animate-pulse opacity-30 font-black tracking-[0.3em] uppercase italic">
              Waiting for Challenger...
            </div>
          )}

          {duel.status === 'REQUESTED' && amIHost && (
            <div className="w-full bg-accent/10 border border-accent/30 p-10 rounded-[2rem]">
              <div className="text-accent font-black text-xs mb-4 uppercase tracking-[0.2em]">New Challenger Spotted</div>
              <div className="text-3xl font-black mb-2">{challengerEmail?.split('@')[0]}</div>
              <div className="text-[10px] text-muted font-mono mb-8 uppercase tracking-widest">
                Streak: 🔥 {duel.pendingOpponent?.streak || 0} &nbsp;|&nbsp; Coins: 🪙 {duel.pendingOpponent?.focusCoins || 0}
              </div>
              <div className="flex gap-4">
                <button onClick={handleAccept} className="flex-1 py-4 bg-accent text-white rounded-2xl font-black hover:opacity-90 transition">ACCEPT</button>
                <button onClick={handleReject} className="flex-1 py-4 border border-accent2 text-accent2 rounded-2xl font-black hover:bg-accent2/10 transition">REJECT</button>
              </div>
            </div>
          )}

          {duel.status === 'REQUESTED' && !amIHost && (
            <div className="text-accent4 animate-pulse flex flex-col items-center">
              <Timer size={60} className="mb-6" />
              <div className="uppercase tracking-[0.2em] font-mono text-sm font-bold italic">Awaiting Host Approval...</div>
            </div>
          )}

          {(duel.status === 'ONGOING' || (duel.status === 'COMPLETED' && !iHaveSolved)) && (
            <div className="w-full">
              <h2 className="text-5xl font-head font-black italic mb-2 uppercase tracking-tighter">
                {opponentLeft ? 'SOLVE TO WIN' : 'BATTLE LIVE'}
              </h2>
              <p className="text-accent3 font-mono text-[10px] mb-10 tracking-[0.3em] font-bold uppercase">
                {opponentLeft ? 'Opponent left — claim your points!' : 'Temporal Sync Active'}
              </p>

              <a href={`https://leetcode.com/problems/${duel.problemSlug}/`} target="_blank" rel="noreferrer"
                className="bg-white text-black w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 mb-4 hover:scale-[1.01] transition shadow-2xl uppercase tracking-widest">
                OPEN ON LEETCODE
              </a>

              {iHaveSolved ? (
                <div className="space-y-4">
                  <div className="py-5 bg-accent3/10 text-accent3 border-2 border-accent3/30 rounded-2xl font-black uppercase text-sm tracking-widest">SOLVE VERIFIED ✓</div>
                  <button onClick={handleQuit} className="w-full py-4 border-2 border-accent text-accent rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition uppercase text-xs tracking-widest">
                    <Plus size={16} /> Exit & Start New Duel
                  </button>
                </div>
              ) : (
                <button onClick={handleVerify} disabled={isFinishing}
                  className="w-full py-5 border-2 border-accent text-accent rounded-2xl font-black uppercase hover:bg-accent hover:text-white transition tracking-widest disabled:opacity-50">
                  {isFinishing ? 'PROCESSING...' : "I'VE GOT AN 'ACCEPTED' STATUS"}
                </button>
              )}
            </div>
          )}

          {duel.status === 'COMPLETED' && iHaveSolved && (
            <div className="text-center w-full">
              <Trophy size={80} className="mx-auto mb-6 text-accent4" />
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Match Concluded</h2>
              <div className="text-accent3 font-mono font-black text-xl italic uppercase tracking-widest bg-accent3/10 py-3 rounded-2xl inline-block px-10 border border-accent3/20">
                Winner: {duel.winner?.split('@')[0] || 'Draw'}
              </div>
              <button onClick={() => navigateRef.current('/duel')}
                className="block mx-auto mt-10 text-muted hover:text-white text-xs underline uppercase font-mono tracking-widest">
                Return to Lobby
              </button>
            </div>
          )}
        </div>

        {/* SIDE FEED */}
        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted px-4 font-bold">Match Feed</h3>

          {/* HOST */}
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${hasUserSolved(hostId) ? 'border-accent3 bg-accent3/5 shadow-lg' : 'bg-surface border-accent/20'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${hasUserSolved(hostId) ? 'bg-accent3 text-black' : 'bg-accent text-white'}`}>
                  {(hostEmail || 'H')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-lg uppercase italic tracking-tighter">{(hostEmail || 'Host').split('@')[0]} {amIHost && '(YOU)'}</div>
                  <div className="text-[10px] text-muted font-mono uppercase">Room Host</div>
                </div>
              </div>
              <div className="text-right">
                {hasUserSolved(hostId)
                  ? <span className="text-accent3 font-mono font-black text-2xl tracking-tighter">{getSolveTime(hostId)} MINS</span>
                  : duel.abandonedBy?.some(a => (a._id || a)?.toString() === hostId)
                  ? <span className="text-accent2 font-bold text-[10px] uppercase">⚠ LEFT</span>
                  : <span className={`text-accent3 font-bold text-[10px] uppercase ${duel.status === 'ONGOING' ? 'animate-pulse' : ''}`}>
                      {duel.status === 'ONGOING' ? 'SOLVING' : 'READY'}
                    </span>
                }
              </div>
            </div>
          </div>

          {/* CHALLENGER */}
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${
            hasUserSolved(challengerId) ? 'border-accent3 bg-accent3/5 shadow-lg'
            : duel.status === 'WAITING' ? 'border-dashed opacity-30 bg-transparent'
            : 'bg-surface border-accent2/20'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${hasUserSolved(challengerId) ? 'bg-accent3 text-black' : 'bg-surface2 text-muted'}`}>
                  {(challengerEmail || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-lg uppercase italic tracking-tighter">
                    {(challengerEmail || 'Searching...').split('@')[0]} {!amIHost && challengerId && '(YOU)'}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest">
                    {opponentLeft
                      ? <span className="text-accent2 font-bold">⚠ LEFT MATCH</span>
                      : duel.status === 'REQUESTED'
                      ? <span className="text-muted">PENDING</span>
                      : <span className="text-muted">Challenger</span>
                    }
                  </div>
                </div>
              </div>
              <div className="text-right">
                {hasUserSolved(challengerId)
                  ? <span className="text-accent3 font-mono font-black text-2xl tracking-tighter">{getSolveTime(challengerId)} MINS</span>
                  : duel.abandonedBy?.some(a => (a._id || a)?.toString() === challengerId)
                  ? <span className="text-accent2 font-bold text-[10px] uppercase">⚠ LEFT</span>
                  : <span className={`text-accent2 font-bold text-[10px] uppercase ${duel.status === 'ONGOING' ? 'animate-pulse' : ''}`}>
                      {duel.status === 'ONGOING' ? 'SOLVING' : ''}
                    </span>
                }
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 bg-accent4/5 border border-accent4/10 rounded-3xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-accent4 shrink-0" size={20} />
              <p className="text-[10px] text-muted uppercase font-mono leading-relaxed">
                Only solves recorded <span className="text-white font-bold underline">after</span> match start are valid.
                If you quit, opponent can still earn points. Once solved, you can exit freely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuelRoom;