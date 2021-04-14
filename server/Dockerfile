FROM node:15.2.1-alpine3.12

WORKDIR /usr/local/app

COPY package.*json ./

RUN npm i

COPY . .

EXPOSE 7000

CMD [ "npm", "run", "start" ]