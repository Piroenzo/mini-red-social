import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface Post {
  id: number;
  content: string;
  image: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    profile_pic: string;
  };
  likes_count: number;
  comments_count: number;
}

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    profile_pic: user?.profile_pic || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUserPosts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/posts`);
      // Filtrar posts del usuario actual
      const userPosts = response.data.posts.filter((post: Post) => post.author.id === user.id);
      setPosts(userPosts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData({
          ...formData,
          profile_pic: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await updateProfile(formData.bio, formData.profile_pic);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: user?.bio || '',
      profile_pic: user?.profile_pic || ''
    });
    setEditing(false);
    setError('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
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
            {editing && (
              <div className="avatar-upload">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-upload" className="btn btn-secondary btn-sm">
                  📷 Cambiar foto
                </label>
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <h2>{user.username}</h2>
            <p className="profile-email">{user.email}</p>
            <p className="profile-join-date">
              Se unió el {formatDate(user.created_at)}
            </p>
            
            {editing ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label htmlFor="bio">Biografía</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Cuéntanos algo sobre ti..."
                    rows={3}
                  />
                </div>
                
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
                
                <div className="profile-edit-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-bio">
                <p>{user.bio || 'No hay biografía disponible'}</p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setEditing(true)}
                >
                  ✏️ Editar perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-posts">
        <h3>📝 Mis Publicaciones ({posts.length})</h3>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h4>No tienes publicaciones aún</h4>
            <p>¡Comienza a compartir contenido con la comunidad!</p>
          </div>
        ) : (
          <div className="posts-container">
            {posts.map(post => (
              <div key={post.id} className="card">
                <div className="card-header">
                  <div className="card-avatar">
                    {post.author.profile_pic ? (
                      <img 
                        src={post.author.profile_pic} 
                        alt={post.author.username}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      post.author.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="card-user-info">
                    <h3>{post.author.username}</h3>
                    <p>{formatDate(post.created_at)}</p>
                  </div>
                </div>
                
                <div className="card-content">
                  <p>{post.content}</p>
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt="Post image" 
                      className="card-image"
                    />
                  )}
                </div>
                
                <div className="card-actions">
                  <span className="action-btn">
                    ❤️ {post.likes_count}
                  </span>
                  <span className="action-btn">
                    💬 {post.comments_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
