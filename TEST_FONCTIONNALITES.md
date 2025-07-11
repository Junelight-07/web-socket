# 🧪 Test des Fonctionnalités - Puzzle Collaboratif

## ✅ Checklist de Test

### 🔗 **Connexion & Interface**
- [ ] Page d'accueil s'affiche correctement
- [ ] Champs "Nom d'utilisateur" et "ID Salle" présents
- [ ] Boutons "Créer une salle" et "Rejoindre" fonctionnels
- [ ] Connexion WebSocket établie (vérifier dans la console)

### 🎮 **Création de Salle**
- [ ] Créer une nouvelle salle avec un nom d'utilisateur
- [ ] ID de salle généré automatiquement
- [ ] Redirection vers le plateau de jeu
- [ ] Pièces de puzzle générées et affichées

### 👥 **Mode Collaboratif**
- [ ] Ouvrir un second onglet/navigateur
- [ ] Rejoindre la même salle avec un autre nom
- [ ] Liste des joueurs mise à jour en temps réel
- [ ] Joueur actuel marqué "(Vous)"

### 📋 **Règles du Jeu**
- [ ] Bouton "📋 Règles du jeu" visible
- [ ] Clic ouvre la modale des règles
- [ ] Contenu des règles complet et clair :
  - Objectif du puzzle
  - Mode collaboratif (4 joueurs max)
  - Instructions de drag & drop
  - Règles importantes
  - Conditions de victoire
- [ ] Bouton "✕" ferme la modale

### 🧩 **Déplacement des Pièces**
- [ ] Cliquer et maintenir sur une pièce la saisit
- [ ] Pièce saisie change d'apparence (effet visuel)
- [ ] Glisser la pièce la déplace en temps réel
- [ ] Relâcher la pièce la dépose
- [ ] Autres joueurs voient le déplacement en direct

### 🤝 **Synchronisation Multi-Joueurs**
- [ ] Pièce saisie par un joueur est grisée pour les autres
- [ ] Indicateur "🤏 [Nom du joueur]" affiché sur pièces tenues
- [ ] Impossible de saisir une pièce tenue par un autre
- [ ] Déplacements visibles instantanément pour tous

### 🎯 **Placement Correct**
- [ ] Zone de placement (rectangle vert pointillé) visible
- [ ] Placer une pièce près de sa position correcte la "snap"
- [ ] Pièce bien placée devient verte avec ✅
- [ ] Pièce bien placée ne peut plus être déplacée

### 🏆 **Victoire**
- [ ] Placer toutes les pièces déclenche la victoire
- [ ] Message de victoire affiché
- [ ] Noms de tous les participants listés

### 📱 **Responsive & UX**
- [ ] Interface adaptée sur mobile/tablette
- [ ] Drag & drop fonctionne sur écran tactile
- [ ] Animations fluides
- [ ] Pas d'erreurs dans la console

## 🐛 **Problèmes Connus & Solutions**

### Erreur CORS "Access to XMLHttpRequest blocked"
```
Solution : Vérifier que le port du frontend est autorisé dans server.js
Ports autorisés : 3000, 3002, 3003
```

### Pièces ne se déplacent pas
```
Solution : Vérifier la connexion WebSocket dans la console
Events à surveiller : grab-piece, move-piece, release-piece
```

### Joueurs ne se voient pas
```
Solution : Vérifier les events player-joined et players-updated
S'assurer que même roomId entre les clients
```

## 📊 **URLs de Test**

### 🖥️ **Développement Local**
- Frontend : http://localhost:3002
- Backend : http://localhost:3001
- Test API : http://localhost:3001/health

### 🌐 **Production Render**
- Frontend : https://votre-frontend.onrender.com
- Backend : https://votre-backend.onrender.com
- Test API : https://votre-backend.onrender.com/health

## 🔧 **Commandes de Test**

### Démarrer les services localement
```bash
# Terminal 1 - Backend
cd back-websocket
npm start

# Terminal 2 - Frontend  
cd front-websocket
npm start
```

### Test de charge (optionnel)
```bash
# Ouvrir plusieurs onglets simultanément
# Créer plusieurs salles
# Tester avec 4 joueurs par salle
```

## ✨ **Fonctionnalités Avancées (Bonus)**

- [ ] Chat entre joueurs
- [ ] Sons de feedback 
- [ ] Animations de victoire
- [ ] Sauvegarde de progression
- [ ] Différentes tailles de puzzle
- [ ] Thèmes visuels personnalisés
- [ ] Mode spectateur
- [ ] Historique des parties

---

**✅ Test réussi quand :** Tous les points de la checklist principale sont validés et le puzzle peut être terminé en collaboration par plusieurs joueurs.
