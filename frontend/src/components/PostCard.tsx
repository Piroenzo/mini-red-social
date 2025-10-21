import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CommentsModal from './CommentsModal';

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

interface PostCardProps {
  post: Post;
  onUpdate: (post: Post) => void;
  onDelete: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [loading, setLoading] = useState(false);

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

  const handleLike = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/posts/${post.id}/like`);
      setIsLiked(response.data.is_liked);
      setLikesCount(response.data.likes_count);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/posts/${post.id}`, {
        content: editContent
      });
      onUpdate(response.data.post);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este post?')) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/posts/${post.id}`);
        onDelete(post.id);
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const isOwner = user?.id === post.author.id;

  return (
    <>
      <div className="card">
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
          {isOwner && (
            <div className="post-actions">
              <button 
                className="action-btn"
                onClick={handleEdit}
                disabled={loading}
              >
                ✏️
              </button>
              <button 
                className="action-btn"
                onClick={handleDelete}
                disabled={loading}
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        <div className="card-content">
          {isEditing ? (
            <div className="edit-form">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="form-group textarea"
                rows={3}
              />
              <div className="edit-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveEdit}
                  disabled={loading}
                >
                  Guardar
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>{post.content}</p>
              {post.image && (
                <img 
                  src={post.image} 
                  alt="Post image" 
                  className="card-image"
                />
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <div className="card-actions">
            <button 
              className={`action-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={loading}
            >
              {isLiked ? '❤️' : '🤍'} {likesCount}
            </button>
            
            <button 
              className="action-btn"
              onClick={() => setShowComments(true)}
            >
              💬 {post.comments_count}
            </button>
          </div>
        )}
      </div>

      {showComments && (
        <CommentsModal
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => {
            // Actualizar contador de comentarios
            setShowComments(false);
            // Refrescar el post para obtener el contador actualizado
            // En una implementación más robusta, podrías actualizar el estado local
          }}
        />
      )}
    </>
  );
};

export default PostCard;
