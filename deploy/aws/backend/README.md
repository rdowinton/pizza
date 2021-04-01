# Backend deployment

## Prerequisites

* You will need an IAM user with full access.
* You will need the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) installed.

## Custom domain configuration

You will need to add a certificate for your custom domain and set the ARN accordingly in `template.yml`.

## Template configuration

1. Move `template.yml.template` to `template.yml`.
2. Replace the placeholders in the parameter defaults.

## Deployment

To deploy your API run