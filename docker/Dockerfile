FROM node:20-alpine

# Install OpenSSL for Prisma engine compatibility (Alpine has libssl.so.3)
# Also install build tools needed for argon2 native compilation on linux/arm64
RUN apk add --no-cache openssl python3 make gcc g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Regenerate Prisma Client for the container's platform (linux-musl-arm64)
RUN npx prisma generate

EXPOSE 3000

# Run migrations and seed before starting dev server
CMD npx prisma migrate deploy && npx prisma db seed && npm run dev
