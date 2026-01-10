FROM node:22-alpine

# Install libc6-compat for Next.js/Turbopack binary compatibility on Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app/web

# Start the application
CMD ["npm", "run", "dev"]
