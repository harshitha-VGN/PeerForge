import React, { useEffect, useState } from 'react';
import API from '../api';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const getLB = async () => {
      const { data } = await API.get('/economy/leaderboard');
      setUsers(data);
    };
    getLB();
  }, []);

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="font-head text-4xl font-black mb-10 italic">🏆 HALL OF FAME</h1>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface2 text-muted font-mono text-xs uppercase">
            <tr>
              <th className="p-5">Rank</th>
              <th className="p-5">User</th>
              <th className="p-5">Streak</th>
              <th className="p-5">Coins</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id} className="border-b border-border/50 hover:bg-white/5 transition">
                <td className="p-5 font-mono text-accent">#{index + 1}</td>
                <td className="p-5 font-bold">{user.email}</td>
                <td className="p-5 text-accent3">🔥 {user.streak}</td>
                <td className="p-5 text-accent4">🪙 {user.focusCoins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;