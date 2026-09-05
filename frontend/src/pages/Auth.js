import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import API from '../api';

const Auth = ({ isLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const { data } = await API.post(endpoint, { email, password });
      
      if (isLogin) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        alert("Account created successfully! Please log in.");
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#0c0c0f] px-4 py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent3/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <form
          onSubmit={handleSubmit}
          className="bg-[#14141a] border border-[#2a2a38] rounded-2xl p-8 sm:p-10 shadow-2xl transition-all duration-200 hover:border-[#3a3a4c]"
        >
          {/* Header & Logo Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-4 shadow-lg shadow-accent/10">
              {isLogin ? <Sparkles size={24} /> : <ShieldCheck size={24} />}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join PeerForge'}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {isLogin 
                ? 'Sign in to access your pods, duels, and progress' 
                : 'Level up your engineering skills with collaborative peers'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-accent2/10 border border-accent2/20 text-accent2 text-xs font-medium">
              {error}
            </div>
          )}
          
          {/* Input fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                <input 
                  type="email" 
                  placeholder="you@domain.com" 
                  className="w-full bg-[#0c0c0f] border border-[#2a2a38] pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-600 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-sm font-normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-[#0c0c0f] border border-[#2a2a38] pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-600 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-sm font-normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-3 px-4 rounded-xl font-semibold mt-6 hover:bg-accent/90 transition shadow-lg shadow-accent/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={16} />}
          </button>

          {/* Switch between Login and Signup */}
          <p className="text-center text-gray-400 mt-6 text-xs">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}{' '}
            <Link 
              to={isLogin ? "/signup" : "/login"} 
              className="text-accent hover:text-accent/80 font-semibold transition"
            >
              {isLogin ? 'Create one now' : 'Sign in here'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;