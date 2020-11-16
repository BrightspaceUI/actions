# Semantic Release Action

This GitHub action uses the [semantic-release](https://semantic-release.gitbook.io/) project to automatically analyze commits since the previous release and increment the package version according to [semantic versioning](https://semver.org/) rules. If it's determined that a release should be created:
* Release notes will be generated
* The version in `package.json` will be incremented
* A GitHub Release will be created
* Optionally, the package will be published to NPM

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
    timeout-minutes: 2
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: Brightspace/third-party-actions@actions/checkout
        with:
          persist-credentials: false
      - name: Setup Node
        uses: Brightspace/third-party-actions@actions/setup-node
        # additional validation steps can be run here
      - name: Semantic Release
        uses: BrightspaceUI/actions/semantic-release@master
        with:
          GITHUB_TOKEN: ${{ secrets.SPECIAL_GITHUB_TOKEN }}
          NPM: true
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Notes:
* If you have additional release validation steps (e.g. build step, validation tests), run them after the "Setup Node" step and before the "Semantic Release" step.
* In the checkout step, you must set the `persist-credentials` option to `false`. This opts out of the default `GITHUB_TOKEN` which is not an admin and cannot bypass branch protection rules.

## NPM Package Deployment

If you'd like the action to deploy your package to NPM, set the `NPM` option to `true` and pass through the `NPM_TOKEN` secret. `NPM_TOKEN` is available automatically as a shared organization secret in the `BrightspaceUI`, `BrightspaceUILabs` and `BrightspaceHypermediaComponents` organizations.

If your package is being published under the `@brightspace-ui` or `@brightspace-ui-labs` NPM organizations, ensure that it has the proper configuration in its `package.json`:

```json
"publishConfig": {
  "access": "public"
}
```

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
