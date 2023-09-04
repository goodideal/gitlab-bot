FROM library/node:lts-alpine

# 设置时区
ENV TIME_ZONE=Asia/Shanghai

RUN \
  echo "${TIME_ZONE}" > /etc/timezone \ 
  && ln -sf /usr/share/zoneinfo/${TIME_ZONE} /etc/localtime

WORKDIR /app

COPY package-lock.json package-lock.json

RUN npm i --no-audit --no-fund --omit=dev

EXPOSE 7001

COPY . /app

CMD ["npm", "start"]
