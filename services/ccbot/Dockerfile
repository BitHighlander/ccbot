#https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/
# --------------> The build image
FROM node:latest AS build
ARG NPM_TOKEN
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc && \
   npm ci --only=production && \
   rm -f .npmrc

# --------------> The production image
FROM node:lts-alpine@sha256:b2da3316acdc2bec442190a1fe10dc094e7ba4121d029cb32075ff59bb27390a
RUN apk add dumb-init
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app
CMD ["dumb-init", "node", "server.js"]

#FROM node:lts-alpine@sha256:b2da3316acdc2bec442190a1fe10dc094e7ba4121d029cb32075ff59bb27390a
#WORKDIR /usr/src/app
#COPY . /usr/src/app
#RUN npm install
#CMD "npm" "start"


# build stage
#FROM node:12
#
#COPY . .
#
#WORKDIR .
#
#RUN npm install
#
#RUN npm run build
#
## Bundle app source
#COPY . .
#
#
#
#CMD [ "npm", "start" ]
