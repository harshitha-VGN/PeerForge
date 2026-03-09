import React, { useEffect, useState } from 'react';
import API from '../api';
import { User, ExternalLink } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');

  useEffect(() => {
    API.get('/auth/me').then(res => {
      setUser(res.data);
      setHandle(res.data.leetcodeUsername || '');
    });
  }, []);

  const saveHandle = async () => {
    try {
      await API.put('/auth/update-leetcode', { leetcodeUsername: handle });
      alert("LeetCode Profile Linked!");
    } catch (err) { alert("Failed to save handle"); }
  };

  if (!user) return <div className="p-10 text-muted">Loading...</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <div className="bg-surface border border-border rounded-3xl p-8">
        <h1 className="text-2xl font-head font-black mb-6">CONNECT ACCOUNTS</h1>
        
        <div className="space-y-6">
          <div className="bg-bg p-6 rounded-2xl border border-border">
            <label className="text-xs text-muted uppercase font-mono block mb-2">LeetCode Username</label>
            <div className="flex gap-2">
              <input 
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. harshita_52"
                className="flex-1 bg-surface border border-border p-3 rounded-xl text-white outline-none focus:border-accent"
              />
              <button onClick={saveHandle} className="bg-accent px-6 rounded-xl font-bold">Save</button>
            </div>
            <p className="text-[10px] text-muted mt-3">
              This allows CodeBuddy to verify your solves automatically. 
              Find your username in your LeetCode profile URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;