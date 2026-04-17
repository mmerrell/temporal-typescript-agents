FROM node:22-slim

WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY *.ts ./

# Keep node_modules in the image; the volume mount overlays /app at runtime
# but node_modules lives under /app so the mount will shadow it.
# We pre-install here for the Instruqt sandbox image; for local dev the
# volume mount of ./agent means you run `npm install` on the host instead.
