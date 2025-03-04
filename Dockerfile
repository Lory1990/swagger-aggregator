FROM node:lts-alpine

# Install OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app
COPY dist/ .
COPY package.json package.json
COPY package-lock.json package-lock.yamjson
RUN npm install
CMD [ "node", "index.js" ]
