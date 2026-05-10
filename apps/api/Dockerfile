FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm install
COPY . .
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN npm run build -w apps/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/index.js"]
