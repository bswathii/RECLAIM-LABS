FROM node:22.14.0-bookworm-slim AS checks

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm test

FROM node:22.14.0-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=checks /app ./
EXPOSE 3000
CMD ["node", "server.mjs"]
