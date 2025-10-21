import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import NewPostModal from './NewPostModal';

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

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data.posts);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleNewPost = (newPost: Post) => {
    setPosts([newPost, ...posts]);
  };

  const handleUpdatePost = (updatedPost: Post) => {
    setPosts(posts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handleDeletePost = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando posts...</p>
      </div>
    );
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h2>📱 Tu Feed</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewPostModal(true)}
        >
          ✨ Nuevo Post
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty-state">
          <h3>¡No hay posts aún!</h3>
          <p>Sé el primero en compartir algo con la comunidad.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewPostModal(true)}
          >
            Crear mi primer post
          </button>
        </div>
      ) : (
        <div className="posts-container">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={handleUpdatePost}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}

      {showNewPostModal && (
        <NewPostModal
          onClose={() => setShowNewPostModal(false)}
          onPostCreated={handleNewPost}
        />
      )}
    </div>
  );
};

export default Feed;
