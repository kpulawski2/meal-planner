FROM node:22-bookworm-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/* \
    && pip3 install --break-system-packages --no-cache-dir -U yt-dlp
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
# server.js imports both adapters, so all backend modules must be inside the image.
COPY server.js price-adapter.js groq-adapter.js ./
ENV NODE_ENV=production
EXPOSE 10000
CMD ["npm","start"]
