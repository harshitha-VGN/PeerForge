import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Swords, Trophy, BookOpen, LogOut, User, Sparkles } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you really want to sign out of PeerForge?");
    if (confirmLogout) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Pods', path: '/pods', icon: <Users size={16} /> },
    { name: 'Duel', path: '/duel', icon: <Swords size={16} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={16} /> },
    { name: 'Review', path: '/review', icon: <BookOpen size={16} /> },
    { name: 'Profile', path: '/profile', icon: <User size={16} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0c0c0f]/80 backdrop-blur-xl border-b border-[#2a2a38] px-6 sm:px-10 py-3.5 flex justify-between items-center transition-all">
      <div className="flex items-center gap-8">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-purple-400 flex items-center justify-center text-white shadow-md shadow-accent/20 group-hover:scale-105 transition">
            <Sparkles size={16} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">
            PEER<span className="text-accent">FORGE</span>
          </span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#14141a] border border-[#2a2a38]/60 p-1 rounded-xl">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'bg-accent text-white shadow-md shadow-accent/20 font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout button */}
      <button 
        onClick={handleLogout}
        className="text-gray-400 hover:text-accent2 p-2 rounded-xl border border-transparent hover:border-accent2/20 hover:bg-accent2/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
        title="Sign Out"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </nav>
  );
};

export default Navbar;