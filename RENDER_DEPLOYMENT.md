# Render Deployment Guide - MONOREPO

## 📁 Structure du projet :
```
web-socket/
├── back-websocket/     (Backend Node.js)
├── front-websocket/    (Frontend React)
└── RENDER_DEPLOYMENT.md
```

## 🚀 Déploiement sur Render (2 services depuis 1 repo)

### 1️⃣ **Backend (Node.js Service)**
- **Type:** Web Service
- **Repository:** votre-username/web-socket
- **Root Directory:** `back-websocket`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Variables d'environnement:**
  - `NODE_ENV` = `production`
  - `FRONTEND_URL` = `https://votre-frontend.onrender.com`

### 2️⃣ **Frontend (Static Site)**
- **Type:** Static Site
- **Repository:** votre-username/web-socket (même repo !)
- **Root Directory:** `front-websocket`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`
- **Variables d'environnement:**
  - `REACT_APP_BACKEND_URL` = `https://votre-backend.onrender.com`

## 📋 **Étapes détaillées :**

### Étape 1 : Préparer le repository GitHub
```bash
# Dans le dossier web-socket/
git init
git add .
git commit -m "Initial commit - Puzzle collaboratif"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/web-socket.git
git push -u origin main
```

### Étape 2 : Créer le service Backend sur Render
1. Aller sur [render.com](https://render.com) → Sign up/Login
2. Cliquer **"New"** → **"Web Service"**
3. Connecter votre repo GitHub `web-socket`
4. Configurations :
   - **Name:** `puzzle-backend` (ou votre choix)
   - **Root Directory:** `back-websocket`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Dans **Environment Variables**, ajouter :
   - `NODE_ENV` = `production`
6. Cliquer **"Create Web Service"**
7. **Copier l'URL** du backend (ex: `https://puzzle-backend-abc123.onrender.com`)

### Étape 3 : Créer le service Frontend sur Render
1. Cliquer **"New"** → **"Static Site"**
2. Sélectionner le même repo `web-socket`
3. Configurations :
   - **Name:** `puzzle-frontend` (ou votre choix)
   - **Root Directory:** `front-websocket`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `build` ⚠️ **ATTENTION : juste "build", pas "npm run build" !**
4. Dans **Environment Variables**, ajouter :
   - `REACT_APP_BACKEND_URL` = `https://puzzle-backend-abc123.onrender.com` (URL du backend)
5. Cliquer **"Create Static Site"**

## 📊 **Configuration Render - Récapitulatif :**

| Champ | ❌ **INCORRECT** | ✅ **CORRECT** |
|-------|------------------|----------------|
| **Build Command** | `npm install && build` | `npm install && npm run build` |
| **Publish Directory** | `npm run build` | `build` |
| **Root Directory** | (vide) | `front-websocket` |

**Explication :**
- **Build Command** = les commandes à exécuter pour compiler
- **Publish Directory** = le nom du dossier contenant les fichiers compilés
- **Root Directory** = le sous-dossier dans votre repo

## 🚨 **Si le build échoue sur Render :**

### Solution 1 : Vérifier la version Node.js
Ajouter dans **Environment Variables** :
- `NODE_VERSION` = `18`

### Solution 2 : Build Command alternatif
Essayer ces commandes dans l'ordre :
1. `npm install && npm run build`
2. `npm ci && npm run build`  
3. `yarn install && yarn build`

### Solution 3 : Fichier .nvmrc (recommandé)
Créer un fichier `.nvmrc` dans `front-websocket/` :

### Étape 4 : Mettre à jour la configuration Backend (CRUCIAL!)
1. Retourner au service Backend
2. Dans **Environment Variables**, ajouter/mettre à jour :
   - `FRONTEND_URL` = `https://puzzle-frontend-xyz789.onrender.com` (URL exacte du frontend)
3. **Redéployer** le backend (obligatoire pour appliquer les changements CORS)

⚠️ **IMPORTANT :** Sans cette étape, vous aurez des erreurs CORS !

## 🚨 **Diagnostics d'erreurs courantes :**

### ❌ **"bash: line 1: build: command not found"**
**Cause :** Build Command incorrecte

**Solution IMMÉDIATE :**
1. **Aller dans Settings → Build & Deploy**
2. **Corriger "Build Command" :**
   - ❌ Si c'est : `npm install && build` → **ERREUR !**
   - ✅ Corriger vers : `npm install && npm run build`
3. **Corriger "Publish Directory" :**
   - ❌ Si c'est : `npm run build` → **ERREUR !**
   - ✅ Corriger vers : `build`
4. **Redéployer**

**Configuration finale correcte :**
- **Build Command :** `npm install && npm run build` 
- **Publish Directory :** `build`

### ❌ **"Publish directory npm run build does not exist!"**
**Cause :** Configuration incorrecte du Publish Directory

**Solution IMMÉDIATE :**
1. **Aller dans Settings → Build & Deploy**
2. **Modifier "Publish Directory" :**
   - ❌ Si c'est : `npm run build` → **ERREUR !**
   - ✅ Corriger vers : `build`
3. **Redéployer**

**Explication :** 
- `npm run build` = **commande** qui génère le dossier
- `build` = **dossier** contenant les fichiers compilés

### ❌ **Build timeout ou erreurs de mémoire**
Ajouter dans Environment Variables :
- `NODE_OPTIONS` = `--max-old-space-size=4096`

### ❌ **Erreurs de dépendances**
Essayer :
- `npm ci` au lieu de `npm install`
- Supprimer `node_modules` et `package-lock.json` puis re-installer

### ❌ **Erreur CORS : "Access to XMLHttpRequest... has been blocked"**
**Cause :** Le backend ne reconnaît pas l'URL du frontend

**Solution IMMÉDIATE :**

**Pour le développement local :**
Si votre frontend fonctionne sur un port différent (ex: 3003 au lieu de 3000), ajoutez le port dans `back-websocket/server.js` :
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [/* production origins */]
    : [
        "http://localhost:3000",
        "http://localhost:3002", 
        "http://localhost:3003", // ← Ajouter le bon port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003"  // ← Ajouter le bon port
      ];
```

**Pour la production Render :**
1. **Aller sur le service Backend sur Render**
2. **Environment Variables → Ajouter/Modifier :**
   - `FRONTEND_URL` = `https://votre-frontend-exact.onrender.com`
3. **Redéployer le backend** (crucial !)
4. **Attendre 2-3 minutes** puis tester

**Exemple concret pour votre cas :**
- Backend : `web-socket-vcnd.onrender.com`
- Frontend : `puzzle-front-and-si-tu-as-envie.onrender.com`
- Variable à ajouter : `FRONTEND_URL` = `https://puzzle-front-and-si-tu-as-envie.onrender.com`

**Vérification :** Ouvrir `https://web-socket-vcnd.onrender.com` → devrait afficher les infos du serveur

## 🔗 URLs Finales :
- **Backend API:** `https://votre-backend.onrender.com`
- **Frontend App:** `https://votre-frontend.onrender.com`

## ⚠️ Important :
- Vous devez créer **2 services différents** sur Render
- Même repository, mais **Root Directory différent** pour chaque service
- Configurez d'abord le backend, puis le frontend avec l'URL du backend

## ✅ **Test final :**
- Ouvrez l'URL du frontend
- Créez une salle de jeu
- Partagez l'URL avec vos collègues
- Profitez du puzzle collaboratif ! 🎉
