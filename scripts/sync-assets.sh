#!/bin/bash

# Script pour synchroniser les assets partagés vers les frontends

ASSETS_SOURCE="public/images"
WEB_APP_DEST="packages/web-app/public/images"

echo "🔄 Synchronisation des assets..."

# Créer les dossiers de destination si nécessaire
mkdir -p "$WEB_APP_DEST"

# Copier les images
echo "📸 Copie des images vers web-app..."
cp -r "$ASSETS_SOURCE"/* "$WEB_APP_DEST/"

# Quand admin-app sera créé, ajouter:
# ADMIN_APP_DEST="packages/admin-app/public/images"
# mkdir -p "$ADMIN_APP_DEST"
# echo "📸 Copie des images vers admin-app..."
# cp -r "$ASSETS_SOURCE"/* "$ADMIN_APP_DEST/"

echo "✅ Synchronisation terminée!"
