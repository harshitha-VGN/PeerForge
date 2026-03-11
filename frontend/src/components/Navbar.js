import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Swords, Trophy, BookOpen, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // used to highlight the active route


  const handleLogout = () => {
    // Confirm before logging out
    const confirmLogout = window.confirm("Do you really want to sign out of CodeBuddy?");
    if (confirmLogout) {
      // Remove stored authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('email');

      // Redirect to login page
      navigate('/login');
    }
  };



  // Navigation menu items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Pods', path: '/pods', icon: <Users size={18} /> },
    { name: 'Duel', path: '/duel', icon: <Swords size={18} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={18} /> },
    { name: 'Review', path: '/review', icon: <BookOpen size={18} /> },
    { name: 'Profile', path: '/profile', icon: <User size={18} /> },
  ];

  return (
    // Sticky navigation bar at the top
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border px-6 py-3 flex justify-between items-center">
      
      <div className="flex items-center gap-8">

        {/* App logo / brand */}
        <Link to="/dashboard" className="font-head text-xl font-black text-accent italic">
          PEER<span className="text-white">FORGE</span>
        </Link>
        
        {/* Desktop navigation links */}
        <div className="hidden md:flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                location.pathname === item.path 
                ? 'bg-accent/10 text-accent'  // active route style
                : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </div>

      </div>

      {/* Logout button */}
      <button 
        onClick={handleLogout}
        className="text-muted hover:text-accent2 p-2 transition border border-transparent hover:border-accent2/20 rounded-lg"
      >
        <LogOut size={20} />
      </button>
      
    </nav>
  );
};

export default Navbar;