# ---------- etapa 1: build ----------
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm install --legacy-peer-deps
  # Asegurar que @popperjs/core esté instalado correctamente
  RUN npm install @popperjs/core --legacy-peer-deps
  COPY . .
  RUN npm run build -- --configuration=production   # o tu comando de build
  
  # ---------- etapa 2: runtime ----------
  FROM nginx:alpine
  # (opcional) elimina la config por defecto
  
  # COPIAR el output REAL del build
  # ───────────────┬──────────────┬─────────
  #                │ proyecto     │ SIN browser
  COPY --from=builder /app/dist/mapp-frontend /usr/share/nginx/html
  
  # (opcional) tu propia nginx.conf
  # COPY nginx.conf /etc/nginx/conf.d
  