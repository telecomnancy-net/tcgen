#!/bin/bash

docker stop tcgen
docker rm tcgen
docker build --tag 'tcgen' .
docker run -d -p 80:80 --name tcgen tcgen
