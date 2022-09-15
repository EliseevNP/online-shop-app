FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

COPY moleculer.config.ts ./
COPY tsconfig.json ./
COPY ./src ./src

RUN npm run build

ARG NPM_SCRIPT=start
ENV DC_ENTRYPOINT_NPM_SCRIPT=$NPM_SCRIPT

EXPOSE 3000 3001

ENTRYPOINT ./docker-entrypoint.sh $DC_ENTRYPOINT_NPM_SCRIPT
