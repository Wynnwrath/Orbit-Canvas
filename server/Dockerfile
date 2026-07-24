FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build

FROM node:18-alpine as production-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build-stage /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
