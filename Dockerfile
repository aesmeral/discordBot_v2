FROM node:16-alpine

WORKDIR /usr/src/app

ENV TZ America/Los_Angeles

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "docker-prod"] # Docker prod