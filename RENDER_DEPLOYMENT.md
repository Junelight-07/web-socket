# Render Deployment Guide

## Backend (Node.js Service)
1. Connecter votre repo GitHub
2. Type: Web Service
3. Root Directory: `back-websocket`
4. Build Command: `npm install`
5. Start Command: `npm start`

### Variables d'environnement Backend :
- `NODE_ENV` = `production`
- `FRONTEND_URL` = `https://your-frontend-app.onrender.com`

## Frontend (Static Site)
1. Type: Static Site  
2. Root Directory: `front-websocket`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `build`

### Variables d'environnement Frontend :
- `REACT_APP_BACKEND_URL` = `https://your-backend-app.onrender.com`

## URLs Finales :
- Backend: `https://your-backend-app.onrender.com`
- Frontend: `https://your-frontend-app.onrender.com`
