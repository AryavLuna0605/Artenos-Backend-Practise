FROM ubuntu:22.04

RUN apt-get update
RUN apt-get install -y wget xz-utils \
    && wget https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-x64.tar.xz \
    && ls -l \
    && tar xf node-v20.10.0-linux-x64.tar.xz \
    && mv node-v20.10.0-linux-x64 /usr/local/node \
    && rm node-v20.10.0-linux-x64.tar.xz \
    && ln -s /usr/local/node/bin/node /usr/local/bin/node \
    && ln -s /usr/local/node/bin/npm /usr/local/bin/npm

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY dist ./dist

CMD ["node", "."]