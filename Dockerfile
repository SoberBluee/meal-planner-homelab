# install all dependencies that will be used in the build stage
FROM node:20-bookworm-slim as deps
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN --mount=type=cache,target=/root/.npm npm ci

# build the actual application using the dependencies from the deps stage
FROM node:20-bookworm-slim as build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# copies the standalone build from the build stage and sets the environment variables
FROM node:20-bookworm-slim as runner
WORKDIR /app

# set the environment variables
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000

# copy the standalon build from the build stage
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

