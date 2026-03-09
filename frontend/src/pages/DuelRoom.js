import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, CheckCircle, ExternalLink, XCircle, UserCheck, Trophy, Loader2, Plus, AlertCircle,Timer } from 'lucide-react';
import API from '../api';

const DuelRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [duel, setDuel] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // 1. FETCH STATUS: SYNCING WITH SERVER
  const fetchStatus = useCallback(async (currentUser) => {
    try {
      const { data } = await API.get(`/duels/status/${roomId}`);
      
      if (currentUser && data) {
        const myId = currentUser._id?.toString();
        const creatorId = (data.creator?._id || data.creator)?.toString();

        // SECURITY: If I am in a WAITING room but am not the Host, I was likely rejected
        if (data.status === "WAITING" && myId !== creatorId) {
          navigate('/duel');
          return;
        }
      }
      setDuel(data);
    } catch (err) { 
      if (err.response?.status === 404) navigate('/duel');
    }
  }, [roomId, navigate]);

  useEffect(() => {
    let interval;
    const init = async () => {
      try {
        const res = await API.get('/auth/me');
        setUser(res.data);
        await fetchStatus(res.data);
        // Polling every 3 seconds to stay in sync with opponent
        interval = setInterval(() => fetchStatus(res.data), 3000);
      } catch (err) { navigate('/login'); }
    };
    init();
    return () => clearInterval(interval);
  }, [fetchStatus, navigate]);

  // 2. LOGIC HELPERS: IDENTIFYING ROLES AND RESULTS
  const myId = user?._id?.toString();
  
  // HOST IDENTIFICATION
  const hostId = (duel?.creator?._id || duel?.creator)?.toString();
  const hostEmail = duel?.creatorEmail || duel?.creator?.email;

  // CHALLENGER IDENTIFICATION
  const challenger = duel?.participants?.find(p => (p._id || p)?.toString() !== hostId);
  const challengerId = (challenger?._id || challenger)?.toString() || (duel?.pendingOpponent?._id || duel?.pendingOpponent)?.toString();
  const challengerEmail = challenger?.email || duel?.pendingOpponent?.email;

  // VERIFICATION CHECKERS (Ensures cards are independent)
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

  // 3. ACTION HANDLERS
  const handleAccept = async () => {
    try { await API.post(`/duels/accept/${roomId}`); fetchStatus(user); } 
    catch (err) { alert("Accept failed"); }
  };

  const handleReject = async () => {
    if (window.confirm("Reject this challenger?")) {
      try { await API.post(`/duels/reject/${roomId}`); fetchStatus(user); } 
      catch (err) { alert("Reject failed"); }
    }
  };

  const handleVerify = async () => {
    if (!user?.leetcodeUsername) return alert("Please link your LeetCode handle in Profile first!");
    setIsFinishing(true);
    try {
      const res = await API.post('/duels/verify', { leetcodeUsername: user.leetcodeUsername, roomId });
      alert(res.data.message);
      fetchStatus(user);
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed. Check your profile settings.");
    } finally { setIsFinishing(false); }
  };

  const handleQuit = async () => {
    const msg = iHaveSolved ? "Exit room?" : "Quit match? Your progress will be lost.";
    if (window.confirm(msg)) {
      await API.post(`/duels/end/${roomId}`);
      navigate('/duel');
    }
  };

  // 4. RENDER GUARD
  if (!duel || !user || !duel.creatorEmail) {
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
            WAR ROOM: <span className="text-accent2">{duel.status !== "WAITING" ? duel.problemTitle : "???"}</span>
          </h1>
        </div>
        <button onClick={handleQuit} className="text-[10px] font-mono text-muted hover:text-accent2 border border-border px-6 py-2 rounded-xl transition uppercase tracking-widest flex items-center gap-2">
          <XCircle size={14}/> {iHaveSolved ? "Exit Room" : "Quit Duel"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* CENTER STAGE (Main Logic) */}
        <div className="bg-surface border border-border p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center text-center min-h-[480px]">
          
          {duel.status === "WAITING" && (
            <div className="animate-pulse opacity-30 font-black tracking-[0.3em] uppercase italic">
               Waiting for Challenger...
            </div>
          )}

          {duel.status === "REQUESTED" && amIHost && (
            <div className="w-full bg-accent/10 border border-accent/30 p-10 rounded-[2rem] animate-in zoom-in duration-300">
               <div className="text-accent font-black text-xs mb-4 uppercase tracking-[0.2em]">New Challenger Spotted</div>
               <div className="text-3xl font-black mb-2">{challengerEmail?.split('@')[0]}</div>
               <div className="text-[10px] text-muted font-mono mb-8 uppercase tracking-widest">Streak: 🔥 {duel.pendingOpponent?.streak || 0} | Coins: 🪙 {duel.pendingOpponent?.focusCoins || 0}</div>
               <div className="flex gap-4">
                  <button onClick={handleAccept} className="flex-1 py-4 bg-accent text-white rounded-2xl font-black hover:opacity-90 transition">ACCEPT</button>
                  <button onClick={handleReject} className="flex-1 py-4 border border-accent2 text-accent2 rounded-2xl font-black hover:bg-accent2/10 transition">REJECT</button>
               </div>
            </div>
          )}

          {duel.status === "REQUESTED" && !amIHost && (
            <div className="text-accent4 animate-pulse flex flex-col items-center">
              <Timer size={60} className="mb-6" />
              <div className="uppercase tracking-[0.2em] font-mono text-sm font-bold italic">Awaiting Host Approval...</div>
            </div>
          )}

          {(duel.status === "ONGOING" || (duel.status === "COMPLETED" && !iHaveSolved)) && (
            <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-5xl font-head font-black italic mb-2 uppercase tracking-tighter">BATTLE LIVE</h2>
              <p className="text-accent3 font-mono text-[10px] mb-10 tracking-[0.3em] font-bold uppercase underline decoration-accent3/30">Temporal Sync Active</p>
              
              <a href={`https://leetcode.com/problems/${duel.problemSlug}/`} target="_blank" rel="noreferrer" className="bg-white text-black w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 mb-4 hover:scale-[1.01] transition shadow-2xl uppercase tracking-widest">OPEN ON LEETCODE</a>
              
              {iHaveSolved ? (
                <div className="space-y-4">
                  <div className="py-5 bg-accent3/10 text-accent3 border-2 border-accent3/30 rounded-2xl font-black uppercase text-sm tracking-widest">SOLVE VERIFIED ✓</div>
                  <button onClick={() => navigate('/duel')} className="w-full py-4 border-2 border-accent text-accent rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition uppercase text-xs tracking-widest"><Plus size={16}/> Start New Duel</button>
                </div>
              ) : (
                <button onClick={handleVerify} disabled={isFinishing} className="w-full py-5 border-2 border-accent text-accent rounded-2xl font-black uppercase hover:bg-accent hover:text-white transition tracking-widest">{isFinishing ? "PROCESSING..." : "I'VE GOT AN 'ACCEPTED' STATUS"}</button>
              )}
            </div>
          )}

          {duel.status === "COMPLETED" && iHaveSolved && (
            <div className="text-center animate-in zoom-in duration-500 w-full">
              <Trophy size={80} className="mx-auto mb-6 text-accent4 shadow-accent4/20" />
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Match Concluded</h2>
              <div className="text-accent3 font-mono font-black text-xl italic uppercase tracking-widest bg-accent3/10 py-3 rounded-2xl inline-block px-10 border border-accent3/20">Winner: {duel.winner?.split('@')[0] || "Draw"}</div>
              <button onClick={() => navigate('/duel')} className="block mx-auto mt-10 text-muted hover:text-white text-xs underline uppercase font-mono tracking-widest">Return to Lobby</button>
            </div>
          )}
        </div>

        {/* SIDE FEED (Participants) */}
        <div className="flex flex-col gap-4">
           <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted px-4 font-bold">Match Feed</h3>
           
           {/* HOST CARD */}
           <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${hasUserSolved(hostId) ? "border-accent3 bg-accent3/5 shadow-lg" : "bg-surface border-accent/20"}`}>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${hasUserSolved(hostId) ? "bg-accent3 text-black" : "bg-accent text-white"}`}>
                    {(hostEmail || "H")[0].toUpperCase()}
                   </div>
                   <div>
                      <div className="font-bold text-lg uppercase italic tracking-tighter">{(hostEmail || "Host").split('@')[0]} {amIHost && "(YOU)"}</div>
                      <div className="text-[10px] text-muted font-mono uppercase">Room Host</div>
                   </div>
                </div>
                <div className="text-right">
                   {hasUserSolved(hostId) ? <span className="text-accent3 font-mono font-black text-2xl tracking-tighter">{getSolveTime(hostId)} MINS</span> : <span className={`text-accent3 font-bold text-[10px] uppercase ${duel.status === "ONGOING" ? "animate-pulse" : ""}`}>{duel.status === "ONGOING" ? "SOLVING" : "READY"}</span>}
                </div>
             </div>
           </div>

           {/* CHALLENGER CARD */}
           <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${hasUserSolved(challengerId) ? "border-accent3 bg-accent3/5 shadow-lg" : duel.status === "WAITING" ? "border-dashed opacity-30 bg-transparent" : "bg-surface border-accent2/20"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${hasUserSolved(challengerId) ? "bg-accent3 text-black" : "bg-surface2 text-muted"}`}>
                    {(challengerEmail || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-lg uppercase italic tracking-tighter">{(challengerEmail || "Searching...").split('@')[0]} {!amIHost && "(YOU)"}</div>
                    <div className="text-[10px] text-muted font-mono uppercase tracking-widest">{duel.status === "REQUESTED" ? "PENDING" : "Challenger"}</div>
                  </div>
                </div>
                <div className="text-right">
                  {hasUserSolved(challengerId) ? <span className="text-accent3 font-mono font-black text-2xl tracking-tighter">{getSolveTime(challengerId)} MINS</span> : <span className={`text-accent2 font-bold text-[10px] uppercase ${duel.status === "ONGOING" ? "animate-pulse" : ""}`}>{duel.status === "ONGOING" ? "SOLVING" : ""}</span>}
                </div>
              </div>
           </div>

           <div className="mt-6 p-6 bg-accent4/5 border border-accent4/10 rounded-3xl">
              <div className="flex items-start gap-4">
                 <AlertCircle className="text-accent4 shrink-0" size={20} />
                 <p className="text-[10px] text-muted uppercase font-mono leading-relaxed">Verification rule: Only solves recorded <span className="text-white font-bold underline">after</span> the match went live are valid.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DuelRoom;