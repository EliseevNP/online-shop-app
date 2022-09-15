#!/bin/sh

npm run db:migrate
npm run db:seed
npm run ${1:-start}
