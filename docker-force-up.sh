#! /bin/bash
docker-compose down --rmi all -v \
    && docker-compose build --no-cache \
    && docker-compose -f docker-compose-staging.yml up -d --force-recreate
