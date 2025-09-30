
FROM node:20-alpine

RUN apk add --no-cache git nginx supervisor

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
