## Dump Database

```
arangodump --output-directory "dump" --overwrite true --server.username root --all-databases true
```

## Restore Database

```
arangorestore --input-directory dump --all-databases --include-system-collections true --create-database true
```
