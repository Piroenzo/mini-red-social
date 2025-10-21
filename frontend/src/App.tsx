import { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('feed');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>🌟 Mini Red Social</h1>
          <div className="auth-tabs">
            <button 
              className={`tab ${currentView === 'login' ? 'active' : ''}`}
              onClick={() => setCurrentView('login')}
            >
              Iniciar Sesión
            </button>
            <button 
              className={`tab ${currentView === 'register' ? 'active' : ''}`}
              onClick={() => setCurrentView('register')}
            >
              Registrarse
            </button>
          </div>
          {currentView === 'login' ? <Login /> : <Register />}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar onViewChange={setCurrentView} currentView={currentView} />
      <main className="main-content">
        {currentView === 'feed' && <Feed />}
        {currentView === 'profile' && <Profile />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;