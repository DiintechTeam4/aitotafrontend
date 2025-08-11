import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './Admin';
import User from './User';
import './App.css'
import Superadmin from './Superadmin';
import Home from './pages/Home';
import Login from './pages/Login';
import AgentMobileTalk from './component/dashboards/components/AgentMobileTalk';
import PublicBusinessDetails from "./component/PublicBusinessDetails";

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem('usertoken');
    const admintoken = localStorage.getItem('admintoken');
    const superadmintoken = localStorage.getItem('superadmintoken');
    console.log("User/Client token:", token);
    console.log("Admin token:", admintoken);
    console.log("Super Admin token:", superadmintoken);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/*" element={<User />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/superadmin/*" element={<Superadmin />} />
        <Route path="/agent/:agentId/talk" element={<AgentMobileTalk />} />
        <Route path="/:slug" element={<PublicBusinessDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
