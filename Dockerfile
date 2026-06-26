FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV DEV_AUTH_ENABLED=true
CMD ["sh", "-c", "npm run db:migrate && npm start"]
