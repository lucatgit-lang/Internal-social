FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --include=optional
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5180
CMD ["nginx", "-g", "daemon off;"]
