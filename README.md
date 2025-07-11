# Projet WebSocket en Temps Réel
Ce projet comprend un serveur WebSocket backend et une application frontend React pour la communication en temps réel.
Notre groupe est composé de 3 membres : Alexy DE BARROS, Fiona VERVERT--RIGA et Romain ROYER.


# Backend WebSocket

Serveur WebSocket pour la communication en temps réel.

## Description

Serveur Node.js avec WebSocket pour gérer les connexions en temps réel et la communication bidirectionnelle avec le client frontend.

## Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn

## Installation

```bash
npm install
```

## Démarrage

```bash
npm start
```

Le serveur WebSocket sera disponible sur `ws://localhost:8080`.

## Scripts disponibles

- `npm start` - Démarre le serveur
- `npm run dev` - Démarre avec nodemon
- `npm test` - Lance les tests

## Structure

```
backend/
├── src/
│   ├── server.js
│   └── handlers/
├── package.json
└── README.md
```

## API WebSocket

### Messages supportés

- `connection` - Nouvelle connexion établie
- `message` - Message de données
- `disconnect` - Déconnexion client

## Licence

MIT

# Frontend React WebSocket

Application React avec communication WebSocket temps réel.

## Description

Interface utilisateur React qui se connecte au serveur WebSocket backend pour une communication en temps réel.

## Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn

## Installation

```bash
npm install
```

## Démarrage

```bash
npm start
```

L'application sera disponible sur `http://localhost:3000`.

## Scripts disponibles

- `npm start` - Démarre l'application en mode développement
- `npm run build` - Crée la version de production
- `npm test` - Lance les tests
- `npm run eject` - Éjecte la configuration

## Connexion WebSocket

L'application se connecte automatiquement au serveur WebSocket sur `ws://localhost:8080`.

## Structure

```
frontend/
├── src/
│   ├── App.js
│   ├── components/
│   └── hooks/
├── public/
├── package.json
└── README.md
```

## Licence

MIT
