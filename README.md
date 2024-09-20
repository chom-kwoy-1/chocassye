Contributions welcome!

# Useful Commands

## Run MongoDB
```bash
docker run --name mongodb-container -v ~/data:/data/db -d -p 27017:27017 mongo
```

## Generate DB
```bash
node make_mongodb.js
```

## Run Development Server
```bash
node mongo_server.js
cd client
npm start
```

## Run Production Server
```bash
npm run build  # build the project
PORT=80 SSL=ON node mongo_server.js  # run the server
```
