import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    profile_pic: string;
  };
}

interface CommentsModalProps {
  postId: number;
  onClose: () => void;
  onCommentAdded: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ postId, onClose, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/posts/${postId}/comments`);
      setComments(response.data.comments);
    } catch (err) {
      setError('Error al cargar comentarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/comments`, {
        content: newComment.trim()
      });

      setComments([...comments, response.data.comment]);
      setNewComment('');
      onCommentAdded();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al agregar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `hace ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `hace ${diffInDays}d`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">💬 Comentarios</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="comments-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando comentarios...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              {error}
            </div>
          ) : comments.length === 0 ? (
            <div className="empty-state">
              <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-avatar">
                    {comment.user.profile_pic ? (
                      <img 
                        src={comment.user.profile_pic} 
                        alt={comment.user.username}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      comment.user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.user.username}</span>
                      <span className="comment-time">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <form onSubmit={handleSubmit} className="comment-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-group">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={2}
                required
              />
            </div>
            
            <div className="comment-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={onClose}
              >
                Cerrar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? 'Comentando...' : 'Comentar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommentsModal;
