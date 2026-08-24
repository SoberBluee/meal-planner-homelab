FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

