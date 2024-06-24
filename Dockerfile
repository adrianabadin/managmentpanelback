FROM node:20
RUN mkdir /home/app
WORKDIR /home/app
COPY package*.* .
COPY rsx.json /home/
RUN npm i 
RUN npm i -g typescript
COPY . .
RUN npx prisma db push --schema ./src/prisma/schema.prisma
EXPOSE 8080
RUN npx tsc
CMD [ "node","./dist/app.js" ]
