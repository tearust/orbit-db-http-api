tag=v0.8.1
echo building tea-orbit-db-http-api..

docker build . -t tearust/tea-orbit-db-http-api:$tag

docker push tearust/tea-orbit-db-http-api:$tag
