# 1st stage to build the image
FROM node:18-alpine as builder

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

# 2nd stage to copy image and create a smaller final image
FROM gcr.io/distroless/nodejs18-debian12

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NEXTAUTH_SECRET changeme

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]