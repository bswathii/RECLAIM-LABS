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
COPY --from=checks /app/server.mjs ./server.mjs
COPY --from=checks /app/server ./server
COPY --from=checks /app/public ./public
COPY --from=checks /app/src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/healthz').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "server.mjs"]
