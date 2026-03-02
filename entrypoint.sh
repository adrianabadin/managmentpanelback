#!/bin/sh
npx prisma db push --schema ./src/prisma/schema.prisma
node ./dist/app.js
