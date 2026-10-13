# Agnes 视频代理镜像。
# 代理用 curl 子进程把本地图片传到公网图床（规避 Node 直连的 socket hang up），
# 所以镜像里必须有 curl——alpine 的 node 镜像默认不带。
#
# 这个镜像同时承载云端同步服务（webdav.js，监听 8789，由 nginx 反代 /dav/）。
# 两个模块跑在同一个 node 进程里，所以 webdav.js 必须做到「异常不出模块」，
# 否则一个坏请求会连带打死视频代理。
FROM node:22-alpine

RUN apk add --no-cache curl

WORKDIR /app
COPY server.js webdav.js idempotency-store.js request-fingerprint.js package.json ./

EXPOSE 8787 8789
CMD ["node", "server.js"]
