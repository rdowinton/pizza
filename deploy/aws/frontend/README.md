# Frontend deployment

## Prerequisites

You will need a non-interactive IAM user with `AmazonS3FullAccess` policy attached.

## Create S3 bucket and policy
Create an S3 bucket and restrict public access.

## Create CloudFront distribution
Create a CloudFront distribution with the following settings:

* Add your custom domain to `Alternative Domains (CNAMES)`.
* Choose `Custom SSL Certificate` and create and verify a certificate in AWS Certificate Manager if necessary.
* Set `Restrict Bucket Access` to `Yes`.
* Set `Origin Access Identity` to `Create a New Identity`.
* Set `Grant Read Permissions on Bucket` to `Yes, Update Bucket Policy`.

## Add CNAME record for custom domain
Set a CNAME record for your domain that points to your CloudFront distribution domain. This will be in the format `xxxxx.cloudfront.net`.

## Build and deploy website
Set `BUCKET_NAME` environment variable and run `deploy.sh`.