# Imagen de la aplicación LeoVeo
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Primero solo las dependencias, para aprovechar la caché de capas de Docker
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

# Después el código
COPY --chown=node:node . .

# No se ejecuta como root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
