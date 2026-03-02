FROM node:20
RUN mkdir /home/app
WORKDIR /home/app
COPY package*.* .
COPY rsx.json /home/
RUN npm i 
RUN npm i -g typescript
COPY . .
EXPOSE 8080
RUN npx tsc
RUN chmod +x /home/app/entrypoint.sh
CMD [ "/bin/sh", "/home/app/entrypoint.sh" ]
