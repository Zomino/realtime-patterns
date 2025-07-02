FROM node:20 AS builder

WORKDIR /app

COPY tsconfig.json ./

COPY package*.json ./
RUN npm install

COPY src ./src

RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]