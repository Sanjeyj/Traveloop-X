FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm install
COPY . .
RUN npm run build -w apps/web

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
