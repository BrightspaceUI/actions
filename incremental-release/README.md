# Incremental Release Action

This GitHub action looks for keywords in the latest commit to automatically increment the package version and create a tag.

## Using the Action

Typically this action is triggered from a workflow that runs on your `master` branch after each commit or pull request merge.

Here's a sample release workflow:

```yml
name: Release
on:
  push:
    branches:
      - master
jobs:
  release:
    if: "!contains(github.event.head_commit.message, 'skip ci')"
    timeout-minutes: 2
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: Brightspace/third-party-actions@actions/checkout
      - name: Setup Node
        uses: Brightspace/third-party-actions@actions/setup-node
        # additional validation steps can be run here
      - name: Incremental Release
        uses: BrightspaceUI/actions/incremental-release@master
        with:
          GITHUB_TOKEN: ${{ secrets.D2L_GITHUB_TOKEN }}
```

Options:
* `DEFAULT_INCREMENT` (default: `skip`): If no release keyword is found in the latest commit message, this value will be used to trigger a release. Can be one of: `skip`, `patch`, `minor`, `major`.
* `DRY_RUN` (default: `false`): Simulates a release but does not actually do one
* `GITHUB_TOKEN`: Token to use to update version in 'package.json' and create the tag

Notes:
* If you have additional release validation steps (e.g. build step, validation tests), run them after the "Setup Node" step and before the "Incremental Release" step.

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
uses: BrightspaceUI/actions/incremental-release@master
with:
  DEFAULT_INCREMENT: minor
```

### Skipping Releases

When a default increment is specified, sometimes you want to bypass it and skip a release. To do this, include `[skip release]` in the commit message.