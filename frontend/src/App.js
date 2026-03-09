import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import Pages
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Workspace from './pages/Workspace';
import Leaderboard from './pages/Leaderboard';
import Pods from './pages/Pods';
import Profile from './pages/Profile';
import Review from './pages/Review';
import DuelRoom from './pages/DuelRoom';
import DuelLobby from './pages/DuelLobby';

// --- HELPER COMPONENT: Protect routes from logged-out users ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // If no token, send them to login
  return token ? children : <Navigate to="/login" />;
};

// --- HELPER COMPONENT: Handle Navbar visibility ---
const Layout = ({ children }) => {
  const location = useLocation();
  // Don't show Navbar on Login or Signup pages
  const showNav = !['/login', '/signup'].includes(location.pathname);
  
  return (
    <>
      {showNav && <Navbar />}
      <div className={showNav ? "min-h-[calc(100vh-64px)]" : ""}>
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Auth isLogin={true} />} />
          <Route path="/signup" element={<Auth isLogin={false} />} />

          {/* Protected Routes (Require Login) */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          
          <Route path="/workspace/:titleSlug" element={
            <ProtectedRoute><Workspace /></ProtectedRoute>
          } />
          
          <Route path="/leaderboard" element={
            <ProtectedRoute><Leaderboard /></ProtectedRoute>
          } />
          
          <Route path="/pods" element={
            <ProtectedRoute><Pods /></ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          
          <Route path="/review" element={
            <ProtectedRoute><Review /></ProtectedRoute>
          } />
          <Route path="/duel" element={<ProtectedRoute><DuelLobby /></ProtectedRoute>} />
<Route path="/duel/:roomId" element={<ProtectedRoute><DuelRoom /></ProtectedRoute>} />

          

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;