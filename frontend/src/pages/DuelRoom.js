import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, XCircle, Trophy, Loader2, Plus, AlertCircle, Timer, UserX, ExternalLink, CheckCircle2 } from 'lucide-react';
import API from '../api';
import socket from '../socket';

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
  const duelRef = useRef(null);

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

      if (data.status === 'WAITING' && myId !== creatorId && !isParticipant && !isPending) {
        if (duelRef.current !== null) {
          navigateRef.current('/duel', { state: { rejected: true, problemTitle: duelRef.current.problemTitle } });
          return;
        }
      }

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

        // ── Connect Sockets for Real-time push ──────────────────────────────
        socket.emit("join_duel", roomId);

        const handleOpponentRequested = (updatedDuel) => {
          setDuel(updatedDuel);
          duelRef.current = updatedDuel;
        };

        const handleOpponentAccepted = (updatedDuel) => {
          setDuel(updatedDuel);
          duelRef.current = updatedDuel;
        };

        const handleOpponentRejected = (data) => {
          const myId = userRef.current?._id?.toString();
          const hostId = (duelRef.current?.creator?._id || duelRef.current?.creator)?.toString();
          if (myId !== hostId) {
            navigateRef.current('/duel', { state: { rejected: true, problemTitle: data.problemTitle } });
          } else {
            fetchStatus();
          }
        };

        const handleSolveVerified = ({ duel: updatedDuel }) => {
          if (updatedDuel) {
            setDuel(updatedDuel);
            duelRef.current = updatedDuel;
          } else {
            fetchStatus();
          }
        };

        const handleOpponentAbandoned = ({ duel: updatedDuel }) => {
          setOpponentLeft(true);
          if (updatedDuel) {
            setDuel(updatedDuel);
            duelRef.current = updatedDuel;
          }
        };

        const handleDuelCancelled = () => {
          alert("Duel room was cancelled by host.");
          navigateRef.current('/duel');
        };

        socket.on("opponent_requested", handleOpponentRequested);
        socket.on("opponent_accepted", handleOpponentAccepted);
        socket.on("opponent_rejected", handleOpponentRejected);
        socket.on("solve_verified", handleSolveVerified);
        socket.on("opponent_abandoned", handleOpponentAbandoned);
        socket.on("duel_cancelled", handleDuelCancelled);

      } catch {
        if (mountedRef.current) navigateRef.current('/login');
      }
    };
    init();

    return () => {
      mountedRef.current = false;
      socket.emit("leave_duel", roomId);
      socket.off("opponent_requested");
      socket.off("opponent_accepted");
      socket.off("opponent_rejected");
      socket.off("solve_verified");
      socket.off("opponent_abandoned");
      socket.off("duel_cancelled");
    };
  }, [roomId, fetchStatus]);

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
    try { await API.post(`/duels/accept/${roomId}`); }
    catch { alert('Accept failed'); }
  };

  const handleReject = async () => {
    if (window.confirm('Reject this challenger? Room reopens for others.')) {
      try { await API.post(`/duels/reject/${roomId}`); }
      catch { alert('Reject failed'); }
    }
  };

  const handleVerify = async () => {
    if (!user?.leetcodeUsername) return alert('Please link your LeetCode handle in Profile first!');
    setIsFinishing(true);
    try {
      const res = await API.post('/duels/verify', { leetcodeUsername: user.leetcodeUsername, roomId });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
    } finally { setIsFinishing(false); }
  };

  const handleQuit = async () => {
    let msg;
    if (iHaveSolved) {
      msg = 'Exit room? Your win is already recorded ✓';
    } else if (opponentLeft) {
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
      <div className="min-h-[calc(100vh-64px)] bg-[#0c0c0f] flex flex-col items-center justify-center text-accent text-sm font-semibold gap-3">
        <Loader2 className="animate-spin" size={32} />
        <span>Connecting to Live Battle Room...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2a2a38]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent2/10 border border-accent2/20 flex items-center justify-center text-accent2 shadow-md">
              <Swords size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {duel.status === 'ONGOING' || duel.status === 'COMPLETED' ? duel.problemTitle : 'Duel Arena'}
                </h1>
                {duel.difficulty && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-accent4/10 text-accent4 border border-accent4/20">
                    {duel.difficulty}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Room #{roomId.slice(-6)} · Real-time WebSocket Battle
              </p>
            </div>
          </div>

          <button 
            onClick={handleQuit} 
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-accent2 border border-[#2a2a38] bg-[#14141a] px-4 py-2.5 rounded-xl hover:border-accent2/40 transition shadow-md"
          >
            <XCircle size={15} /> 
            <span>{iHaveSolved || opponentLeft ? 'Exit Arena' : 'Quit Duel'}</span>
          </button>
        </div>

        {/* Opponent left banner */}
        {opponentLeft && duel.status === 'ONGOING' && (
          <div className="mb-6 bg-accent4/10 border border-accent4/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
            <UserX className="text-accent4 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-accent4 text-sm">Opponent left the match</p>
              <p className="text-gray-400 text-xs mt-0.5">
                {iHaveSolved ? 'You already solved — feel free to exit.' : 'Submit your solution on LeetCode to claim the win points.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CENTER STAGE */}
          <div className="lg:col-span-7 bg-[#14141a] border border-[#2a2a38] p-8 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center min-h-[440px]">
            {duel.status === 'WAITING' && (
              <div className="space-y-4 py-8">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto animate-pulse">
                  <Swords size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Waiting for Challenger</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Your battle room is active in the public lobby. You'll be notified the moment another developer challenges you.
                </p>
              </div>
            )}

            {duel.status === 'REQUESTED' && amIHost && (
              <div className="w-full bg-[#0c0c0f] border border-accent/30 p-6 sm:p-8 rounded-2xl shadow-lg">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-accent/10 text-accent border border-accent/20 mb-4">
                  Incoming Challenge
                </span>
                <div className="text-2xl font-bold text-white mb-2">{challengerEmail?.split('@')[0]}</div>
                <div className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-4">
                  <span>Streak: 🔥 {duel.pendingOpponent?.streak || 0}</span>
                  <span>Coins: 🪙 {duel.pendingOpponent?.focusCoins || 0}</span>
                </div>
                <div className="flex gap-3 max-w-xs mx-auto">
                  <button 
                    onClick={handleAccept} 
                    className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition shadow-lg shadow-accent/20 text-xs"
                  >
                    Accept Battle
                  </button>
                  <button 
                    onClick={handleReject} 
                    className="flex-1 py-3 border border-accent2/40 text-accent2 rounded-xl font-semibold hover:bg-accent2/10 transition text-xs"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {duel.status === 'REQUESTED' && !amIHost && (
              <div className="space-y-4 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent4/10 border border-accent4/20 flex items-center justify-center text-accent4 mx-auto animate-pulse">
                  <Timer size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Awaiting Host Approval</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Challenge request sent to room host. The duel will start immediately upon acceptance.
                </p>
              </div>
            )}

            {(duel.status === 'ONGOING' || (duel.status === 'COMPLETED' && !iHaveSolved)) && (
              <div className="w-full space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {opponentLeft ? 'Solve to Claim Victory' : 'Battle in Progress'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Solve the problem on LeetCode and click verify once accepted.
                  </p>
                </div>

                <a 
                  href={`https://leetcode.com/problems/${duel.problemSlug}/`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-3.5 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-lg text-sm"
                >
                  <span>Solve on LeetCode</span>
                  <ExternalLink size={16} />
                </a>

                {iHaveSolved ? (
                  <div className="space-y-3">
                    <div className="py-3 px-4 bg-accent3/10 text-accent3 border border-accent3/30 rounded-xl font-semibold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Solution Verified & Accepted</span>
                    </div>
                    <button 
                      onClick={handleQuit} 
                      className="w-full py-3 bg-accent text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-accent/90 transition shadow-lg shadow-accent/20 text-xs"
                    >
                      <Plus size={16} /> 
                      <span>Exit & Start New Duel</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleVerify} 
                    disabled={isFinishing}
                    className="w-full py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition shadow-lg shadow-accent/20 text-sm disabled:opacity-50"
                  >
                    {isFinishing ? 'Verifying LeetCode Submissions...' : "I've Submitted an 'Accepted' Solution"}
                  </button>
                )}
              </div>
            )}

            {duel.status === 'COMPLETED' && iHaveSolved && (
              <div className="text-center w-full space-y-4 py-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
                  <Trophy size={36} />
                </div>
                <h2 className="text-2xl font-bold text-white">Duel Concluded</h2>
                <div className="inline-block px-4 py-2 rounded-xl bg-accent3/10 border border-accent3/30 text-accent3 text-sm font-semibold">
                  Winner: {duel.winner?.split('@')[0] || 'Draw'}
                </div>
                <div>
                  <button 
                    onClick={() => navigateRef.current('/duel')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline mt-4"
                  >
                    Return to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SIDE FEED */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="text-xs font-semibold text-gray-400 px-1">
              Match Status
            </div>

            {/* HOST CARD */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 shadow-xl ${
              hasUserSolved(hostId) 
                ? 'border-accent3/40 bg-accent3/5' 
                : 'bg-[#14141a] border-[#2a2a38]'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    hasUserSolved(hostId) ? 'bg-accent3 text-black' : 'bg-accent/10 border border-accent/20 text-accent'
                  }`}>
                    {(hostEmail || 'H')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">
                      {(hostEmail || 'Host').split('@')[0]} {amIHost && '(You)'}
                    </div>
                    <div className="text-xs text-gray-400">Host</div>
                  </div>
                </div>
                <div>
                  {hasUserSolved(hostId) ? (
                    <span className="text-accent3 font-bold text-xs bg-accent3/10 px-2.5 py-1 rounded-lg border border-accent3/20">
                      Solved ({getSolveTime(hostId)}m)
                    </span>
                  ) : duel.abandonedBy?.some(a => (a._id || a)?.toString() === hostId) ? (
                    <span className="text-accent2 text-xs font-semibold bg-accent2/10 px-2.5 py-1 rounded-lg border border-accent2/20">
                      Left
                    </span>
                  ) : (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      duel.status === 'ONGOING' 
                        ? 'bg-accent/10 text-accent border border-accent/20 animate-pulse' 
                        : 'bg-[#0c0c0f] text-gray-400 border border-[#2a2a38]'
                    }`}>
                      {duel.status === 'ONGOING' ? 'Coding...' : 'Ready'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CHALLENGER CARD */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 shadow-xl ${
              hasUserSolved(challengerId) 
                ? 'border-accent3/40 bg-accent3/5' 
                : duel.status === 'WAITING' 
                ? 'border-dashed border-[#2a2a38] bg-transparent opacity-60' 
                : 'bg-[#14141a] border-[#2a2a38]'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    hasUserSolved(challengerId) 
                      ? 'bg-accent3 text-black' 
                      : 'bg-[#0c0c0f] border border-[#2a2a38] text-gray-400'
                  }`}>
                    {(challengerEmail || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">
                      {(challengerEmail || 'Searching...').split('@')[0]} {!amIHost && challengerId && '(You)'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {opponentLeft ? 'Left' : duel.status === 'REQUESTED' ? 'Pending' : 'Challenger'}
                    </div>
                  </div>
                </div>
                <div>
                  {hasUserSolved(challengerId) ? (
                    <span className="text-accent3 font-bold text-xs bg-accent3/10 px-2.5 py-1 rounded-lg border border-accent3/20">
                      Solved ({getSolveTime(challengerId)}m)
                    </span>
                  ) : duel.abandonedBy?.some(a => (a._id || a)?.toString() === challengerId) ? (
                    <span className="text-accent2 text-xs font-semibold bg-accent2/10 px-2.5 py-1 rounded-lg border border-accent2/20">
                      Left
                    </span>
                  ) : (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      duel.status === 'ONGOING' 
                        ? 'bg-accent2/10 text-accent2 border border-accent2/20 animate-pulse' 
                        : 'bg-[#0c0c0f] text-gray-500 border border-[#2a2a38]'
                    }`}>
                      {duel.status === 'ONGOING' ? 'Coding...' : 'Waiting'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Match info alert */}
            <div className="p-4 bg-[#14141a] border border-[#2a2a38] rounded-2xl flex items-start gap-3 text-xs text-gray-400 shadow-md">
              <AlertCircle className="text-accent shrink-0 mt-0.5" size={16} />
              <p className="leading-relaxed">
                Verification checks for LeetCode submissions recorded after match start. Once your solution is verified, you are free to exit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuelRoom;