FROM node:15.14.0-alpine3.13

RUN mkdir api

WORKDIR /api

COPY . .

RUN npm i

CMD ["node", "src/cli.js"]