Contributions welcome!

# Useful Commands

## Generate DB
```bash
node mongo_db.js
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
sudo cp -rf build/* /var/www/html/  # copy the build to the serving directory
PORT=80 SSL=ON node mongo_server.js  # run the server
```

## Dump Database

```bash
arangodump --output-directory "dump" --overwrite true --server.username root --all-databases true
```

## Restore Database

```bash
arangorestore --input-directory dump --all-databases --include-system-collections true --create-database true
```
