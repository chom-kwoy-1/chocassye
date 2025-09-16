#!/bin/bash

git pull --recurse-submodules && git submodule update --init --recursive --remote && npm i && npm run build && pm2 restart all && pm2 logs
