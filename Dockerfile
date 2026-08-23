FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./

RUN apt-get update && apt-get install -y python3 python3-pip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
 
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]

