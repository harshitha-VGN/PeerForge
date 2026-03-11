import React from 'react';
import { Zap, Coins, TrendingUp } from 'lucide-react';

const DashboardStats = ({ user }) => {
  return (
    // Grid layout for dashboard statistic cards
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Current Streak Card */}
      <div className="bg-[#14141a] p-6 rounded-2xl border border-[#2a2a38] flex items-center gap-4">
        <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500">
          <Zap fill="currentColor" />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
            Current Streak
          </div>
          <div className="text-2xl font-black">{user.streak} Days</div>
        </div>
      </div>

      {/* Focus Coins Card */}
      <div className="bg-[#14141a] p-6 rounded-2xl border border-[#2a2a38] flex items-center gap-4">
        <div className="bg-yellow-500/10 p-3 rounded-xl text-yellow-500">
          <Coins />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
            Focus Coins
          </div>
          <div className="text-2xl font-black">{user.focusCoins}</div>
        </div>
      </div>

      {/* Daily Check-in Button */}
      <button 
        className="bg-purple-600 hover:bg-purple-700 p-6 rounded-2xl flex items-center justify-center gap-2 transition font-bold"
        onClick={() => alert("Daily check-in complete!")}
      >
        <TrendingUp size={24} />
        Complete Daily Check-in
      </button>

    </div>
  );
};

export default DashboardStats;