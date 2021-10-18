tag=v0.0.8
echo building tea-orbit-db-http-api..

docker build . -t tearust/tea-orbit-db-http-api:$tag

docker push tearust/tea-orbit-db-http-api:$tag
