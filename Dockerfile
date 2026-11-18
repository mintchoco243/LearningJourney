FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY frontend/package*.json ./frontend/
RUN npm ci --include=dev --prefix frontend

COPY . .
RUN npm run build --prefix frontend

ENV NODE_ENV=production
CMD ["sh", "-c", "npm run db:migrate && npm run start:server"]
