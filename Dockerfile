# 1️⃣ Use a lightweight Node image
FROM node:20-alpine

# 2️⃣ Set working directory inside container
WORKDIR /app

# 3️⃣ Copy package files first (for caching)
COPY package*.json ./

# 4️⃣ Install dependencies (clean & reproducible)
RUN npm ci

# 5️⃣ Copy rest of the source code
COPY . .

# 6️⃣ Build TypeScript → dist/
RUN npm run build

# 7️⃣ Expose backend port
EXPOSE 5000

# 8️⃣ Run the compiled app
CMD ["node", "dist/index.js"]