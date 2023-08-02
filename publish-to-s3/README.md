# Publish To S3 Action

This GitHub action uses the [aws-cli](https://github.com/aws/aws-cli) (already installed on GitHub and our self-hosted runners) to upload a given directory to a given S3 bucket. The files will be compressed, and you can specify the caching you would like for these assets.

## Using the Action

This action could be triggered from a workflow that runs on your `main` branch after each commit or pull request merge to upload a new version to your bucket. It could also be used to upload a dev version or information for every pull request. You will need to assume the role that gives you access to the S3 bucket before running this action.

Here's a sample workflow:

```yml
name: Publish
on:
  push:
    branches:
      - main

jobs:
  publish:
    timeout-minutes: 5
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: Brightspace/third-party-actions@actions/checkout
      - name: Setup Node
        uses: Brightspace/third-party-actions@actions/setup-node
        with:
          node-version-file: .nvmrc
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Assume role
        uses: Brightspace/third-party-actions@aws-actions/configure-aws-credentials
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }}
          role-to-assume: <role_that_can_upload_to_your_bucket>
          role-duration-seconds: 3600
          aws-region: ca-central-1
      - name: Publish
        uses: BrightspaceUI/actions/publish-to-s3@main
        with:
          BUCKET_PATH: s3://<your_bucket>/<path>
          PUBLISH_DIRECTORY: ./build/
```

Options:

* `BUCKET_PATH` (required): The full path of your bucket, including subdirectories, to which to publish
* `PUBLISH_DIRECTORY` (required): The directory within your repo to publish to S3 (e.g. `"./build/"`)
* `CACHE` (default: `""`): An optional comma-separated list of all file extensions you wish to have cached for 1 year (e.g. `"js,css"`)
* `CACHE_DEFAULT` (default: `""`): An optional default caching policy to apply to all files (e.g. `"--cache-control max-age=120"`)

## Setting Up AWS Access Creds

In order to have the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` available to you for the step to assume your publishing role, you will need to configure that for your repo in repo-settings.  [See the documentation](https://github.com/Brightspace/repo-settings/blob/main/docs/aws.md).
