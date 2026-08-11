FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev

FROM base AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
USER app
EXPOSE 3000
CMD ["node", "src/server.js"]
