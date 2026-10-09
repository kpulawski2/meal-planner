FROM node:22-bookworm-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/* \
    && pip3 install --break-system-packages --no-cache-dir -U yt-dlp
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY public ./public
COPY data ./data
COPY recipe-import-api ./recipe-import-api
EXPOSE 10000
CMD ["npm","start"]
