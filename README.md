Contributions welcome!

# Useful Commands

## Generate DB
```bash
node arango_db.js
```

## Run Production Server
```bash
PORT=80 SSL=ON node arango_server.js
```

## Dump Database

```bash
arangodump --output-directory "dump" --overwrite true --server.username root --all-databases true
```

## Restore Database

```bash
arangorestore --input-directory dump --all-databases --include-system-collections true --create-database true
```
