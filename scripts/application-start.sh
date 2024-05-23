echo "Starting application..."

docker-compose --file /home/ubuntu/docker-compose.production.yml up -d db
docker-compose --file /home/ubuntu/docker-compose.production.yml up -d app
sleep 3

docker-compose --file /home/ubuntu/docker-compose.production.yml up -d mqtt
sleep 3
docker-compose --file /home/ubuntu/docker-compose.production.yml up -d redis
sleep 3
docker-compose --file /home/ubuntu/docker-compose.production.yml up -d producer
sleep 3
docker-compose --file /home/ubuntu/docker-compose.production.yml up -d consumer
sleep 3

