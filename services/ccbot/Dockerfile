#https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/


# build stage
FROM node:12
COPY . .
WORKDIR .
RUN npm install
RUN npm run build
# Bundle app source
COPY . .

CMD [ "npm", "start" ]
