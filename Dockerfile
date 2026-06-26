FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV DEV_AUTH_ENABLED=true
ENV JWT_SECRET=gLh2xK9mNpQrVwYzA4bDfJtSuCeHiOkR7vXnMqWsZyBcFjUlPdTgEaImKoNhLw
CMD ["sh", "-c", "npm run db:migrate && npm start"]
