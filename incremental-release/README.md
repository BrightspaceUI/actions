# Incremental Release Action

This GitHub action looks for keywords in the latest commit to automatically increment the package version and create a tag.

## Using the Action

Typically this action is triggered from a workflow that runs on your `main` branch after each commit or pull request merge.

Here's a sample release workflow:

```yml
name: Release
on:
  push:
    branches:
      - main
jobs:
  release:
    if: "!contains(github.event.head_commit.message, 'skip ci')"
    timeout-minutes: 2
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: Brightspace/third-party-actions@actions/checkout
        with:
          persist-credentials: false
      - name: Setup Node
        uses: Brightspace/third-party-actions@actions/setup-node
      - name: Incremental Release
        uses: BrightspaceUI/actions/incremental-release@main
        with:
          GITHUB_TOKEN: ${{ secrets.D2L_GITHUB_TOKEN }}
```

Options:
* `DEFAULT_INCREMENT` (default: `skip`): If no release keyword is found in the latest commit message, this value will be used to trigger a release. Can be one of: `skip`, `patch`, `minor`, `major`.
* `DRY_RUN` (default: `false`): Simulates a release but does not actually do one
* `GITHUB_TOKEN`: Token to use to update version in 'package.json' and create the tag -- see section below on branch protection for more details

Outputs:
* `VERSION`: will contain the new version number if a release occurred, empty otherwise

Notes:
* If you have additional release validation steps (e.g. build step, validation tests), run them after the "Setup Node" step and before the "Incremental Release" step.

### Branch Protection Rules and D2L_GITHUB_TOKEN

The release step will fail to write to `package.json` if you have branch protection rules set up in your repository. To get around this, we use a special Admin `D2L_GITHUB_TOKEN`.

[Learn how to set up the D2L_GITHUB_TOKEN...](../docs/branch-protection.md)

## Triggering a Release

Releases occur based on the most recent commit message:
* Commits which contain `[increment patch]` will trigger a `patch` release. Example: `validate input before using [increment patch]`
* Commits which contain `[increment minor]` will trigger a `minor` release. Example: `add toggle() method [increment minor]`
* Commits which contain `[increment major]` will trigger a `major` release. Example: `breaking all the things [increment major]`

**Note:** When merging a pull request, this will be the merge commit message.

### Default Increment

Normally, if the most recent commit does not contain `[increment major|minor|patch]`, no release will occur. However, by setting the `DEFAULT_INCREMENT` option you can control which type of release will occur.

In this example, a minor release will occur if no increment value is found in the most recent commit:

```yml
uses: BrightspaceUI/actions/incremental-release@main
with:
  DEFAULT_INCREMENT: minor
```

### Skipping Releases

When a default increment is specified, sometimes you want to bypass it and skip a release. To do this, include `[skip version]` in the commit message.

## Publishing a Free-Range App Using `frau-publisher`

A common use case for `incremental-release` is with Free-Range Apps. With each release, FRAs publish to the CDN using [frau-publisher](https://github.com/Brightspace/frau-publisher), which traditionally used Travis CI environment variables to determine the new version.

Here's a sample workflow to publish a Free-Range App:

```yml
name: Release
on:
  push:
    branches:
      - main
jobs:
  release:
    if: "!contains(github.event.head_commit.message, 'skip ci')"
    timeout-minutes: 2
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: Brightspace/third-party-actions@actions/checkout
        with:
          persist-credentials: false
      - name: Setup Node
        uses: Brightspace/third-party-actions@actions/setup-node
      # additional build/validation steps can be run here
      - name: Incremental Release
        id: release
        uses: BrightspaceUI/actions/incremental-release@main
        with:
          GITHUB_TOKEN: ${{ secrets.D2L_GITHUB_TOKEN }}
      - name: Publish
        if: steps.release.outputs.VERSION != ''
        run: npx frau-publisher --devtag="$GIT_COMMIT" -v="${{ steps.release.outputs.VERSION }}" --f="./dist/**/*.*" --m="app" --t="my-fra"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_SESSION_TOKEN: ${{ secrets.AWS_SESSION_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
```

Notes:
* `id` has been added to the release step so that we can reference its `VERSION` output parameter in the subsequent step
* The publish step will be skipped if no version increment occurred
* Obviously the `--f` (files), `--m` (module type) and `--t` (target directory) parameters passed to `frau-publisher` may be different for your FRA
* This example uses IAM tokens to publish to the CDN's S3 bucket -- [learn more about setting up IAM tokens](https://github.com/Brightspace/iam-build-tokens/blob/master/docs/howto-cdn-users.md). When [registering your repo](https://github.com/Brightspace/iam-build-tokens/tree/master/terraform/roles), we recommend [using a hub role](https://github.com/Brightspace/iam-build-tokens/blob/master/docs/howto-hub-roles.md), so that you can easily add more roles as needed (for example, to set up visual-diff tests in the future).  If using a hub role, you'll need to assume the role first before trying to publish:
  ```yml
  ...
  - name: Assume role
        if: steps.release.outputs.VERSION != ''
        uses: Brightspace/third-party-actions@aws-actions/configure-aws-credentials
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }}
          role-to-assume: "arn:aws:iam::771734770799:role/cdn-infrastructure-<your_repo>"
          role-duration-seconds: 3600
          aws-region: us-east-1
      - name: Publish to CDN
        if: steps.release.outputs.VERSION != ''
        run: npx frau-publisher --v="${{ steps.release.outputs.VERSION }}" --f="./dist/**/*.*" --m="app" --t="my-fra"
        env:
          # cred variables set in the "Assume role" step
          AWS_DEFAULT_REGION: us-east-1
  ```
