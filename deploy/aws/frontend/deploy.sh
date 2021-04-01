cd ../../..
npm run build
aws s3 sync build s3://${BUCKET_NAME}