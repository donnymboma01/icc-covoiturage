FROM node:alpine AS build_image
WORKDIR /app
COPY package*.json ./
# install dependencies
RUN npm install --frozen-lockfile
COPY . .
# build
RUN npm run build
# remove dev dependencies
RUN npm prune --production
FROM node:alpine
WORKDIR /app
# copy from build image
COPY --from=build_image /app/package.json ./package.json
COPY --from=build_image /app/node_modules ./node_modules
COPY --from=build_image /app/.next ./.next
COPY --from=build_image /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
