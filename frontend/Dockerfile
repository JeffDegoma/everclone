FROM node:12-alpine as builder

WORKDIR /usr/local/app

COPY package.*json yarn.lock ./

COPY . ./

RUN yarn install

RUN yarn build

# change to custom nginx image
FROM nginx:latest 

COPY --from=builder /usr/local/app/build /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]