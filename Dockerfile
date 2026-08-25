# Étape 1 : Build de l'application
FROM node:18-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste des fichiers
COPY . .

# Build de l'application (Vite génère le dossier /dist)
RUN npm run build

# Étape 2 : Serveur de production Nginx
FROM nginx:alpine

# Copie des fichiers statiques générés depuis l'étape précédente
COPY --from=builder /app/dist /usr/share/nginx/html

# Optionnel : si vous avez besoin d'une config Nginx spécifique pour le routage SPA (React)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposition du port 80
EXPOSE 80

# Lancement de Nginx
CMD ["nginx", "-g", "daemon off;"]
