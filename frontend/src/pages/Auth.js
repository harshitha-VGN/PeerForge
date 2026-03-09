import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. Added Link
import API from '../api';

const Auth = ({ isLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const { data } = await API.post(endpoint, { email, password });
      
      if (isLogin) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        alert("Account created! Please login.");
        navigate('/login');
      }
    } catch (err) {
      alert(err.response?.data?.message || "Auth failed");
      
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0f]">
      <form onSubmit={handleSubmit} className="bg-[#14141a] p-8 rounded-2xl border border-[#2a2a38] w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full bg-[#0c0c0f] border border-[#2a2a38] p-3 rounded-lg text-white focus:border-[#7c6aff] outline-none transition"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-[#0c0c0f] border border-[#2a2a38] p-3 rounded-lg text-white focus:border-[#7c6aff] outline-none transition"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="w-full bg-[#7c6aff] text-white py-3 rounded-lg font-bold mt-6 hover:bg-[#6a5ae6] transition shadow-lg shadow-[#7c6aff]/20">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>

        {/* --- ADDED THIS SECTION BELOW --- */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <Link 
            to={isLogin ? "/signup" : "/login"} 
            className="text-[#7c6aff] ml-2 hover:underline font-medium"
          >
            {isLogin ? 'Create one' : 'Login here'}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Auth;