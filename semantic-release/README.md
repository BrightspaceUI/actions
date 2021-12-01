# Semantic Release Action

This GitHub action uses the [semantic-release](https://semantic-release.gitbook.io/) project to automatically analyze commits since the previous release and increment the package version according to [semantic versioning](https://semver.org/) rules. If it's determined that a release should be created:
* Release notes will be generated
* The version in `package.json` will be incremented
* A GitHub Release will be created
* Optionally, the package will be published to NPM

## Using the Action

Typically this action is triggered from a workflow that runs on your `main` branch after each commit or pull request merge.

Here's a sample release workflow:

```yml
name: Release
on:
  push:
    branches:
      - main
      - '[0-9]+.x'
      - '[0-9]+.[0-9]+.x'
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
      - name: Semantic Release
        uses: BrightspaceUI/actions/semantic-release@main
        with:
          GITHUB_TOKEN: ${{ secrets.D2L_GITHUB_TOKEN }}
          NPM: true
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Options:

* `DEFAULT_BRANCH` (default: `"main"`): name of the default release branch
* `DRY_RUN` (default: `false`): Runs semantic-release with the `--dry-run` flag to simulate a release but not actually do one
* `GITHUB_TOKEN`: Token to use to update version in 'package.json' and create GitHub release -- see section below on branch protection for more details
* `NPM` (default: `false`): Whether or not to release as an NPM package (see "NPM Package Deployment" below for more info)
* `NPM_TOKEN` (optional if `NPM` is `false`): Token to publish to NPM (see "NPM Package Deployment" below for more info)

Outputs:
* `VERSION`: will contain the new version number if a release occurred, empty otherwise

Notes:
* If you have additional release validation steps (e.g. build step, validation tests), run them after the "Setup Node" step and before the "Semantic Release" step.
* This example will release only from `main` and maintenance branches (e.g. `1.15.x` or `2.x`) -- see more info about maintenance branches below.

### Branch Protection Rules and D2L_GITHUB_TOKEN

The release step will fail to write to `package.json` if you have branch protection rules set up in your repository. To get around this, we use a special Admin `D2L_GITHUB_TOKEN`.

[Learn how to set up the D2L_GITHUB_TOKEN...](../docs/branch-protection.md)

## NPM Package Deployment

If you'd like the action to deploy your package to NPM, set the `NPM` option to `true` and pass through the `NPM_TOKEN` secret. `NPM_TOKEN` is available automatically as a shared organization secret in the `BrightspaceUI`, `BrightspaceUILabs` and `BrightspaceHypermediaComponents` organizations.

If your package is being published under the `@brightspace-ui` or `@brightspace-ui-labs` NPM organizations, ensure that it has the proper configuration in its `package.json`:

```json
"publishConfig": {
  "access": "public"
}
```

Also ensure that `"private": true` is not present.

## Triggering a Release

Recall the [semantic versioning](https://semver.org/) rules:
1. **MAJOR** version when you make incompatible API changes,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

Releases occur based on the commit messages since the previous release. Our semantic-release configuration uses the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) when analyzing commits.

* Commits which are prefixed with `fix` or `perf` will trigger a `patch` release. Example: `fix: validate input before using`
* Commits which are prefixed with `feat:` will trigger a `minor` release. Example: `feat: add toggle() method`
* Other suggested prefixes which will **NOT** trigger a release: `build`, `ci`, `docs`, `style`, `refactor` and `test`. Example: `docs: adding README for new component`

To revert a change, add the `revert` prefix to the original commit message. This will cause the reverted change to not appear in release notes. Example: `revert: fix: validate input before using`.

To trigger a MAJOR release, include `BREAKING CHANGE:` with a space or two newlines in the footer of the commit message.

## Releasing from Maintenance Branches

Occasionally you'll want to backport a feature or bug fix to an older release. `semantic-release` refers to these as [maintenance branches](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#maintenance-branches).

Maintenance branch names should be of the form: `+([0-9])?(.{+([0-9]),x}).x`.

Regular expressions are complicated, but this essentially means branch names should look like:
* `1.15.x` for patch releases on top of the `1.15` release (after version `1.16` exists)
* `2.x` for feature releases on top of the `2` release (after version `3` exists)
