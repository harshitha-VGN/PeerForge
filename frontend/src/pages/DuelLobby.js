import React, { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { Swords, Plus, Play, Lock } from 'lucide-react';

const DuelLobby = () => {

  // Stores all duel rooms available in the lobby
  const [rooms, setRooms] = useState([]);

  // Selected category for creating a duel
  const [selectedCategory, setSelectedCategory] = useState('Random');

  // Logged-in user's ID
  const [myId, setMyId] = useState('');

  const navigate = useNavigate();

  // Categories available for duel problems
  const categories = [
    'Random','Arrays','Strings','DP','Graphs','Stack',
    'Sliding Window','Bit Manipulation','Backtracking','Binary Search','Trees'
  ];

  // Fetch lobby rooms and current user info
  const fetchData = async () => {
    try {
      const [rRes, uRes] = await Promise.all([
        API.get('/duels/lobby'),
        API.get('/auth/me'),
      ]);

      setRooms(rRes.data);
      setMyId(uRes.data._id);

    } catch (err) {
      console.error('Lobby fetch failed:', err);
    }
  };

  // Initial fetch + auto refresh every 4 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Create a new duel room
  const handleCreate = async () => {
    try {
      const { data } = await API.post('/duels/create', { category: selectedCategory });

      // Navigate to duel room
      navigate(`/duel/${data.roomId}`);

    } catch (err) {
      alert(err.response?.data?.message || 'Error creating room.');
    }
  };

  // Send join request to an existing room
  const handleJoinRequest = async (roomId) => {
    try {
      await API.post(`/duels/request/${roomId}`);

      // Navigate to duel room
      navigate(`/duel/${roomId}`);

    } catch (err) {
      alert(err.response?.data?.message || 'Could not join battle.');
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto font-body text-white">

      {/* ─── Create Duel Panel ───────────────────────────────────── */}
      <div className="bg-surface border border-border p-8 rounded-[2rem] mb-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">

        <div>
          <h1 className="text-3xl font-head font-black italic flex items-center gap-3">
            <Swords className="text-accent" /> THE WAR ROOM
          </h1>
          <p className="text-muted text-sm mt-1">
            Select a topic and challenge the community.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-bg border border-border p-3 rounded-xl text-white outline-none focus:border-accent text-sm font-bold md:w-48"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Create duel button */}
          <button
            onClick={handleCreate}
            className="bg-accent px-8 py-3 rounded-xl font-black hover:scale-105 transition flex items-center gap-2"
          >
            <Plus size={18}/> CREATE DUEL
          </button>

        </div>
      </div>

      {/* Empty lobby message */}
      {rooms.length === 0 && (
        <div className="text-center py-20 text-muted font-mono text-xs uppercase tracking-[0.4em] animate-pulse">
          No active rooms — create one to start!
        </div>
      )}

      {/* ─── Duel Rooms Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {rooms.map(room => {

          const currentUid = myId?.toString();

          // Check user's relationship to the room
          const isCreator = (room.creator?._id || room.creator)?.toString() === currentUid;
          const isParticipant = room.participants?.some(p => (p._id || p)?.toString() === currentUid);
          const isPending = (room.pendingOpponent?._id || room.pendingOpponent)?.toString() === currentUid;

          const isMember = isCreator || isParticipant || isPending;

          const hostName = (room.creatorEmail || room.creator?.email || 'User').split('@')[0];

          // ONGOING rooms should only appear for participants
          const isOngoing = room.status === 'ONGOING';
          if (isOngoing && !isMember) return null;

          // Determine if user can join
          const canJoin = !isMember && room.status === 'WAITING' && !room.locked;

          return (
            <div
              key={room.roomId}
              className={`bg-surface border p-6 rounded-3xl transition-all relative overflow-hidden group
                ${isMember
                  ? 'border-accent/50 ring-1 ring-accent/20 bg-accent/5'
                  : 'border-border hover:border-accent/30'
                }`}
            >

              {/* Room status */}
              <div className="flex justify-between items-start mb-4">

                <span
                  className={`text-[10px] font-mono px-2 py-1 rounded-md font-black uppercase tracking-widest
                    ${room.status === 'WAITING'
                      ? 'bg-accent4/10 text-accent4'
                      : room.status === 'REQUESTED'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-accent3/10 text-accent3'
                    }`}
                >
                  {room.status === 'WAITING'
                    ? '● Waiting'
                    : room.status === 'REQUESTED'
                    ? '● Requested'
                    : '● Live'}
                </span>

                <span className="text-muted text-[10px] font-mono">
                  {room.participants?.length}/2 Players
                </span>

              </div>

              {/* Room info */}
              <h3 className="text-xl font-head font-black mb-1 text-white uppercase">
                {hostName}'s Battle
              </h3>

              <p className="text-muted text-xs mb-8 font-mono italic">
                Topic: {room.category}
              </p>

              {/* Action button */}
              <button
                onClick={() => {
                  if (isMember)
                    navigate(`/duel/${room.roomId}`);
                  else if (canJoin)
                    handleJoinRequest(room.roomId);
                }}

                disabled={!isMember && !canJoin}

                className={`w-full py-3 font-black rounded-xl transition flex items-center justify-center gap-2 uppercase tracking-widest text-xs
                  ${isMember
                    ? 'bg-accent text-white'
                    : canJoin
                    ? 'bg-accent3 text-black hover:scale-[1.01]'
                    : 'bg-surface2 border border-border text-muted cursor-not-allowed'
                  }`}
              >

                {isMember
                  ? 'CONTINUE BATTLE'
                  : canJoin
                  ? <><Play size={14} fill="currentColor"/> JOIN MATCH</>
                  : <><Lock size={12}/> FULL / IN PROGRESS</>
                }

              </button>

            </div>
          );
        })}

      </div>
    </div>
  );
};

export default DuelLobby;