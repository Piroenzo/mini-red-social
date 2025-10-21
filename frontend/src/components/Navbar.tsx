import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onViewChange: (view: string) => void;
  currentView: string;
}

const Navbar: React.FC<NavbarProps> = ({ onViewChange, currentView }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onViewChange('feed')}>
        🌟 Mini Red Social
      </div>
      
      <div className="navbar-nav">
        <button
          className={`nav-link ${currentView === 'feed' ? 'active' : ''}`}
          onClick={() => onViewChange('feed')}
        >
          📱 Feed
        </button>
        
        <button
          className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          👤 Perfil
        </button>
        
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.profile_pic ? (
                <img 
                  src={user.profile_pic} 
                  alt={user.username}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <span className="user-name">{user.username}</span>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
