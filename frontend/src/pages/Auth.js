import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // React Router hooks + navigation link
import API from '../api';

const Auth = ({ isLogin }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Decide endpoint based on login/signup mode
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';

      // Send authentication request to backend
      const { data } = await API.post(endpoint, { email, password });
      
      if (isLogin) {
        // Save JWT token locally after successful login
        localStorage.setItem('token', data.token);

        // Redirect to dashboard
        navigate('/dashboard');

      } else {
        // After signup, ask user to login
        alert("Account created! Please login.");
        navigate('/login');
      }

    } catch (err) {
      // Show backend error message if available
      alert(err.response?.data?.message || "Auth failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0f]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#14141a] p-8 rounded-2xl border border-[#2a2a38] w-full max-w-md shadow-2xl"
      >

        {/* Form heading */}
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {/* Input fields */}
        <div className="space-y-4">

          {/* Email input */}
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full bg-[#0c0c0f] border border-[#2a2a38] p-3 rounded-lg text-white focus:border-[#7c6aff] outline-none transition"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password input */}
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-[#0c0c0f] border border-[#2a2a38] p-3 rounded-lg text-white focus:border-[#7c6aff] outline-none transition"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

        </div>

        {/* Submit button */}
        <button className="w-full bg-[#7c6aff] text-white py-3 rounded-lg font-bold mt-6 hover:bg-[#6a5ae6] transition shadow-lg shadow-[#7c6aff]/20">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>

        {/* Switch between Login and Signup */}
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