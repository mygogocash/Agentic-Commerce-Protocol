FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_ANALYTICS_ENABLED=false
ARG NEXT_PUBLIC_GTM_ID=
ARG NEXT_PUBLIC_ANALYTICS_DEBUG=false

ENV NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_ANALYTICS_DEBUG=$NEXT_PUBLIC_ANALYTICS_DEBUG

COPY package.json package-lock.json ./
RUN yarn install --frozen-lockfile 

COPY . .
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user and switch to it for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

COPY --from=builder --chown=nodejs:nodejs /app ./

EXPOSE 3000
CMD ["npm", "start"]
