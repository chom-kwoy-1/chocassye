## Dump Database

```
arangodump --output-directory "dump" --overwrite true --server.database etym_db --server.username root
```

## Restore Database

```
arangorestore --input-directory dump --all-databases --include-system-collections true --create-database true
```
