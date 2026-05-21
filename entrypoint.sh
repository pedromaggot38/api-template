#!/bin/sh
# entrypoint.sh

echo "Executando migrações do banco de dados..."
npx prisma migrate deploy

echo "Iniciando a aplicação..."
npm run start