FROM library/node:lts-alpine

COPY . /app
WORKDIR /app

# 设置时区
ENV TIME_ZONE=Asia/Shanghai

# 在容器内运行命令
# COPY ./config/npmrc ~/.npmrc
RUN \
  echo "${TIME_ZONE}" > /etc/timezone \ 
  && ln -sf /usr/share/zoneinfo/${TIME_ZONE} /etc/localtime \
  && npm config set registry https://registry.npmmirror.com/ \
  && npm i --no-audit --no-fund --production

CMD ["npm", "start"]
