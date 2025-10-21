import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

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

interface NewPostModalProps {
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('El contenido es requerido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/posts`, {
        content: content.trim(),
        image: image
      });

      onPostCreated(response.data.post);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">✨ Crear Nuevo Post</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="content">¿Qué quieres compartir?</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe algo interesante..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Imagen (opcional)</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageUpload}
            />
            {image && (
              <div className="image-preview">
                <img 
                  src={image} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    borderRadius: '8px',
                    marginTop: '0.5rem'
                  }}
                />
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setImage('')}
                  style={{ marginTop: '0.5rem' }}
                >
                  Eliminar imagen
                </button>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !content.trim()}
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;
