#!/bin/bash
echo "🚀 Démarrage du build frontend..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Nettoyer le cache npm
npm cache clean --force

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm ci

# Créer le build
echo "🔨 Création du build..."
npm run build

echo "✅ Build terminé ! Dossier build créé."
ls -la build/
