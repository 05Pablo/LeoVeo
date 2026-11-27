# Imagen de la aplicación LeoVeo (tema 7: Docker)

# Versión de Node fijada para builds reproducibles. Se puede cambiar en el build:
#   docker build --build-arg NODE_VERSION=22 .
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

# Metadatos de la imagen (estándar OCI)
LABEL org.opencontainers.image.title="LeoVeo" \
      org.opencontainers.image.description="Aplicación web de reseñas de películas y libros" \
      org.opencontainers.image.source="https://github.com/05Pablo/LeoVeo" \
      org.opencontainers.image.version="1.0.0"

ENV NODE_ENV=production
WORKDIR /app

# Primero solo las dependencias, para aprovechar la caché de capas de Docker
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

# Después el código. Los secretos (.env) NO entran en la imagen: lo impide .dockerignore
# y se pasan en tiempo de ejecución como variables de entorno (docker-compose.yml)
COPY --chown=node:node . .

# No se ejecuta como root (la imagen oficial de Node ya trae el usuario "node")
USER node

EXPOSE 3000

# Docker y Compose comprueban que la app responde
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
