# Publish To CDN Action

This action leverages the [publish-to-s3](../publish-to-s3/) GitHub Action, and configures it specifically for publishing to the [Brightspace CDN](https://desire2learn.atlassian.net/wiki/spaces/DEVCENTRAL/pages/3314221651/Brightspace+CDN) (`https://s.brightspace.com`).

Features:
- Prevents existing files from being overwritten
- Caches all assets for 1 year
- Enables `public-read` access
- Prefixes `bucket-path` with `s3://d2lprodcdn/`
- Automatically assumes the correct role for publishing

> [!IMPORTANT]  
> Published files will be cached indefinitely, so ensure a mechanism for cache invalidation is present, such as a version number in the `cdn-path`. For example: `<lib-name>/<version>`.

## Using the Action

This action is typically triggered from a release workflow that runs on a repo's `main` branch when a new release is created.

To have the appropriate secrets available, set up the `cdn` capability [in repo-settings](https://github.com/Brightspace/repo-settings/blob/main/docs/cdn.md).

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
        uses: Brightspace/setup-node@main
        with:
          node-version-file: .nvmrc
      - name: Install dependencies
        run: npm install
      - name: Release
        id: release
        uses: <semantic/match-lms/incremental>
      - name: Publish
        if: steps.release.outputs.VERSION != ''
        uses: BrightspaceUI/actions/publish-to-cdn@main
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }}
          cdn-path: <lib-name>/${{ steps.release.outputs.VERSION }}
          publish-directory: ./build/
```

Options:

* `aws-access-key-id`, `aws-secret-access-key`, `aws-session-token` (required): Set these to the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` repository secrets
* `cdn-path` (required): The path on the CDN beneath `s3://d2lprodcdn/`, to which to publish
* `publish-directory` (required): The directory within your repo to publish to the CDN
