# Use official Node.js LTS image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install --legacy-peer-deps; fi

# Copy all source code
COPY . .

# Build the Next.js app
RUN npm run build

# Production image, copy only necessary files
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built assets and node_modules from build stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/next.config.js ./next.config.js
COPY --from=base /app/next-env.d.ts ./next-env.d.ts
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/.env.production ./.env.production

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
