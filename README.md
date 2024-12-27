## Tag images
To tag a local image with ID 'ff8a750b2faa' as 'iccbrx/gateway' with the tag 'dev'  
docker tag 71b3d1f9e8ba iccbrx/covoiturage:latest
docker tag 71b3d1f9e8ba iccbrx/icc_nginx:latest

## Push images
docker push iccbrx/covoiturage
docker push iccbrx/icc_nginx:latest