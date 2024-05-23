echo "Starting application..."

docker-compose --file /home/ubuntu/docker-compose.production.yml up -d db
docker-compose --file /home/ubuntu/docker-compose.production.yml up -d app
sleep 1

docker-compose --file /home/ubuntu/docker-compose.production.yml up -d mqtt