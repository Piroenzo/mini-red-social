from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import base64

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# Configuración
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Usar SQLite para deploy en Render (más simple y confiable)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///red_social.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Inicializar extensiones
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app, origins=[os.getenv('FRONTEND_URL', 'http://localhost:5173')])

# Modelos
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text, default='')
    profile_pic = db.Column(db.Text, default='')  # Base64 encoded image
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    posts = db.relationship('Post', backref='author', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='user', lazy=True, cascade='all, delete-orphan')

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    image = db.Column(db.Text, default='')  # Base64 encoded image
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relaciones
    likes = db.relationship('Like', backref='post', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='post', lazy=True, cascade='all, delete-orphan')

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Evitar likes duplicados
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='unique_like'),)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

# Rutas de autenticación
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Faltan campos requeridos'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'El nombre de usuario ya existe'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'El email ya está registrado'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        bio=data.get('bio', '')
    )
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'message': 'Usuario registrado exitosamente',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'bio': user.bio,
            'profile_pic': user.profile_pic
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Faltan credenciales'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'message': 'Login exitoso',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'bio': user.bio,
            'profile_pic': user.profile_pic
        }
    })

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'bio': user.bio,
        'profile_pic': user.profile_pic,
        'created_at': user.created_at.isoformat()
    })

@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    data = request.get_json()
    
    if 'bio' in data:
        user.bio = data['bio']
    
    if 'profile_pic' in data:
        user.profile_pic = data['profile_pic']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Perfil actualizado exitosamente',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'bio': user.bio,
            'profile_pic': user.profile_pic
        }
    })

# Rutas de posts
@app.route('/api/posts', methods=['GET'])
def get_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    posts = Post.query.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    posts_data = []
    for post in posts.items:
        posts_data.append({
            'id': post.id,
            'content': post.content,
            'image': post.image,
            'created_at': post.created_at.isoformat(),
            'author': {
                'id': post.author.id,
                'username': post.author.username,
                'profile_pic': post.author.profile_pic
            },
            'likes_count': len(post.likes),
            'comments_count': len(post.comments)
        })
    
    return jsonify({
        'posts': posts_data,
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page
    })

@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('content'):
        return jsonify({'error': 'El contenido es requerido'}), 400
    
    post = Post(
        content=data['content'],
        image=data.get('image', ''),
        user_id=user_id
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify({
        'message': 'Post creado exitosamente',
        'post': {
            'id': post.id,
            'content': post.content,
            'image': post.image,
            'created_at': post.created_at.isoformat(),
            'author': {
                'id': post.author.id,
                'username': post.author.username,
                'profile_pic': post.author.profile_pic
            },
            'likes_count': 0,
            'comments_count': 0
        }
    }), 201

@app.route('/api/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post no encontrado'}), 404
    
    if post.user_id != user_id:
        return jsonify({'error': 'No tienes permisos para editar este post'}), 403
    
    data = request.get_json()
    
    if 'content' in data:
        post.content = data['content']
    
    if 'image' in data:
        post.image = data['image']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Post actualizado exitosamente',
        'post': {
            'id': post.id,
            'content': post.content,
            'image': post.image,
            'created_at': post.created_at.isoformat(),
            'author': {
                'id': post.author.id,
                'username': post.author.username,
                'profile_pic': post.author.profile_pic
            },
            'likes_count': len(post.likes),
            'comments_count': len(post.comments)
        }
    })

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post no encontrado'}), 404
    
    if post.user_id != user_id:
        return jsonify({'error': 'No tienes permisos para eliminar este post'}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'message': 'Post eliminado exitosamente'})

# Rutas de likes
@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post no encontrado'}), 404
    
    existing_like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
    
    if existing_like:
        db.session.delete(existing_like)
        action = 'unliked'
    else:
        like = Like(user_id=user_id, post_id=post_id)
        db.session.add(like)
        action = 'liked'
    
    db.session.commit()
    
    return jsonify({
        'message': f'Post {action} exitosamente',
        'likes_count': len(post.likes),
        'is_liked': action == 'liked'
    })

# Rutas de comentarios
@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post no encontrado'}), 404
    
    comments_data = []
    for comment in post.comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'user': {
                'id': comment.user.id,
                'username': comment.user.username,
                'profile_pic': comment.user.profile_pic
            }
        })
    
    return jsonify({'comments': comments_data})

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post no encontrado'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('content'):
        return jsonify({'error': 'El contenido del comentario es requerido'}), 400
    
    comment = Comment(
        content=data['content'],
        user_id=user_id,
        post_id=post_id
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        'message': 'Comentario creado exitosamente',
        'comment': {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'user': {
                'id': comment.user.id,
                'username': comment.user.username,
                'profile_pic': comment.user.profile_pic
            }
        }
    }), 201

# Ruta de salud
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'API funcionando correctamente'})

# Crear tablas
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
