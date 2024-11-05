# Usa un'immagine di base leggera con Node.js e Alpine Linux
FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia solo i file di configurazione (package.json e yarn.lock) per sfruttare la cache Docker
COPY package.json yarn.lock ./

# Installa le dipendenze dell'app con Yarn
RUN yarn install --frozen-lockfile

# Copia il resto del codice dell'applicazione
COPY . .

# Espone la porta dell'applicazione (ad esempio, 3000)
EXPOSE 3000

# Comando di avvio dell'app
CMD ["yarn", "start"]
