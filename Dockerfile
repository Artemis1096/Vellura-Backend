FROM node:alpine3.20
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD [ "nodemon", "Server.js"] 