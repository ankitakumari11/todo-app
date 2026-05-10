# ---- Stage 1: Builder ----
# We use a full node image to install ALL dependencies including devDependencies
# devDependencies are needed to run tests (jest, supertest)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (Docker layer caching trick)
# If package.json hasn't changed, Docker reuses this cached layer
# and skips npm ci — makes builds much faster
COPY package*.json ./
RUN npm ci

# Copy rest of source code
COPY . .


# now contents inside container:
# /app
#  ├── package.json
#  ├── package-lock.json
#  ├── src/
#  ├── tests/ (not this becoz it is ignored in dockerignore)
#  └── all project files


# ---------------------------- Stage 2: Production -----------------------------------------
# Start fresh with a clean image
# We DON'T copy node_modules from builder
# We only install production dependencies (smaller image, no jest/supertest in prod)
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copy only the source code from builder (not tests, not coverage reports)
COPY --from=builder /app/src ./src

# Run as non-root user (security best practice)
# node user is built into the node:alpine image
USER node

EXPOSE 5000

CMD ["node", "src/index.js"]


# Why multi-stage build?

# Stage 1 installs everything including dev tools (jest etc.)
# Stage 2 only has production code
# Final image is much smaller (no test libraries, no source maps)
# Smaller image = faster pull in Kubernetes = faster deployments
# Also smaller attack surface for security

# Multi-stage builds use a builder stage to install all dependencies (including dev tools) so we can run tests and prepare the app in a consistent environment. That builder image can even be used in CI/CD to execute tests inside Docker. The final stage includes only production dependencies and required code, making the image smaller, faster to deploy, and more secure.


# 🔹 Why still keep builder stage then?
# Even without tests:
# Keeps pattern consistent
# Future-ready (if you enable tests in container)
# Separates dev vs prod dependencies


# npm ci = “clean install” (for CI/CD environments)
# 👉 It installs dependencies exactly as locked in package-lock.json
# Key behavior:
# Deletes existing node_modules
# Installs exact versions from package-lock.json
# Fails if package.json and lock file don’t match
# Faster and more predictable than npm install


# 🔹 What is npm ci --only=production (or --prod)?
# This installs only production dependencies, skipping dev ones.
# From your package.json:
# Installed:
# "dependencies": {
#   "express": "...",
#   "mongoose": "...",
#   "cors": "...",
#   "dotenv": "..."
# }
# NOT installed:
# "devDependencies": {
#   "jest": "...",
#   "supertest": "..."
# }