FROM node:22 AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
CMD ["node", "."]
