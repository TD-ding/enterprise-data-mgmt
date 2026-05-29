FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend/src ./src

RUN mkdir -p data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=./data/enterprise.db

EXPOSE 3000

CMD ["node", "src/app.js"]
