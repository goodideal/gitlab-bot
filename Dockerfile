FROM library/node:lts-alpine

COPY . /app
WORKDIR /app

RUN cd /app && \
    npm i --production

CMD ["npm", "start"]
