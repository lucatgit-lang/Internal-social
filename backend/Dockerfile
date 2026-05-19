FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4010
CMD ["sh", "-c", "npm run migrate && npm run seed && npm run dev"]
