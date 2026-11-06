FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl unzip python3
COPY package.json setup.js server.js ./
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
