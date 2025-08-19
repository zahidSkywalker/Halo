# HALO - Modern Social Media Platform

A full-fledged, modern, scalable social networking application built with Next.js, Node.js, and PostgreSQL.

## 🚀 Features

### Core Features
- **Authentication**: JWT-based auth with OAuth support (Google, Facebook, GitHub)
- **User Profiles**: Customizable profiles with privacy settings
- **Content System**: Text, images, videos, links with hashtags and mentions
- **Feed & Discovery**: Personalized feeds with infinite scrolling
- **Real-time Notifications**: WebSocket-powered notifications
- **Messaging**: Direct messages and group chats
- **Admin Panel**: User management and analytics dashboard

### Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript, JWT
- **Database**: PostgreSQL, Redis (caching)
- **Real-time**: Socket.IO
- **File Storage**: AWS S3 abstraction
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, React Testing Library

## 🏗️ Architecture

```
halo/
├── frontend/          # Next.js React application
├── backend/           # Node.js Express API
├── shared/            # Shared types and utilities
├── docker/            # Docker configuration
├── docs/              # Documentation
└── scripts/           # Development scripts
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

### Development Setup

1. **Clone and setup**
```bash
git clone <repository-url>
cd halo
```

2. **Start with Docker**
```bash
docker-compose up -d
```

3. **Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

4. **Setup environment**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

5. **Run migrations**
```bash
cd backend && npm run migrate
```

6. **Start development servers**
```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev
```

### Default Accounts
- **Admin**: admin@halo.com / admin123
- **Test User**: user@halo.com / user123

## 📚 API Documentation

API documentation is available at `/api/docs` when the backend is running.

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Production Build
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
See `.env.example` files in both frontend and backend directories.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.