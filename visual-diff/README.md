# Visual Diff Action

This GitHub action runs your repo's [visual diff tests](https://github.com/BrightspaceUI/visual-diff).  If the tests fail, a draft PR will be opened with the new goldens against the branch/PR that triggered the action.  If they pass, any open goldens PRs for that branch/PR will be closed for you.

More specifically, this action will:
* Install the `@brightspace-ui/visual-diff`, `mocha` and `puppeteer` dependencies for you, so you don't need to include them in your local `devDependencies`
* Cleanup abandoned golden PRs
* Run your visual diff tests and display the results (including links to the visual diff reports stored in S3)
* If failures occurred, it will open/update the corresponding goldens PR with the new goldens and links to the failed reports
* If the tests passed, it will close the corresponding goldens PR if it exists

## Using the Action

Typically this action is triggered from a CI (continuous integration) workflow that runs on your pull requests, ensuring that your new code changes did not cause unexpected visual changes before they are merged.

Here's a sample ci workflow:

```yml
name: CI
on: pull_request
jobs:
  test:
    timeout-minutes: 5
    runs-on: ubuntu-latest
    steps:
      - uses: Brightspace/third-party-actions@actions/checkout
      - uses: Brightspace/third-party-actions@actions/setup-node
      - name: Install dependencies
        run: npm install
        # additional linting and testing steps here
      - name: Visual Diff Tests
        uses: BrightspaceUI/actions/visual-diff@main
        with:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_SESSION_TOKEN: ${{ secrets.AWS_SESSION_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Options:
* `AWS_ACCESS_KEY_ID`: Access key id for the role that will assume the visual diff role - see [setup details](#setting-up-aws-access-creds) below.
* `AWS_SECRET_ACCESS_KEY`: Access key secret for the role that will assume the visual diff role - see [setup details](#setting-up-aws-access-creds) below.
* `AWS_SESSION_TOKEN`: Session token for the role that will assume the visual diff role - see [setup details](#setting-up-aws-access-creds) below.
* `DRAFT_PR` (default: `true`): Whether to open the goldens PR as a draft PR.
* `GITHUB_TOKEN`: Token to use to open the goldens PR.  This does not need admin privileges, so you can use the standard `GITHUB_TOKEN` that exists automatically.
* `TEST_PATH` (default: `./{,!(node_modules)/**}/*.visual-diff.{js,mjs}`): Path passed into the mocha call defining the locations and name structure of the tests.
* `TEST_TIMEOUT` (default: `40000`): Test timeout passed into the mocha call.

Notes:
* You can also run this action in your release workflow to confirm the `main` branch is in a good state before releasing.  If there's a problem, a PR will be opened against `main` to get the goldens back in the expected state.  This mostly comes down to a time versus risk trade-off - the risk of things getting out of sync may be lower than the time taken to run your visual diff tests every release.
* You can use the standard `GITHUB_TOKEN` that exists automatically, but will need to [setup the AWS secrets](#setting-up-aws-access-creds).

## Setting Up AWS Access Creds

In order to have the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` available to you, you will need to add that info to your repo setup in [`repo-settings`](https://github.com/Brightspace/repo-settings).  The role you want to assume already exists, so you only need to worry about "signing up" to receive rotating tokens for it.

Specifically, you will need to add the following to `<your_repo>.yaml` in [https://github.com/Brightspace/repo-settings/tree/main/repositories/github](https://github.com/Brightspace/repo-settings/tree/main/repositories/github):
```
aws_access:
  repo:
    assumable_role_arns:
      # Dev-UiPlatform
      - arn:aws:iam::037018655140:role/visual-diff-githubactions-access
```

Once you've merged the above, you'll see the new secrets in your repo within a few minutes!  These tokens will be rotated automatically for you.

Notes:
* This uses [`iam-build-tokens`](https://github.com/Brightspace/iam-build-tokens) hub roles behind the scenes, so you can register multiple roles to assume if needed (for example, if you also need permissions for deployment).

## Removing CODEOWNER Restrictions for Golden Update PRs

If you have a `CODEOWNERS` file for your repo, you may not want the visual-diff pull requests to have the same restrictions as other PRs.  Visual-diff PRs are usually opened against a branch that will be reviewed later by a code owner anyways. To remove the code owner restriction on visual-diff PRs, you can add the following to your `CODEOWNERS` file:

```
*       @<your_team> <some_username>
golden/
```

## Writing Visual Diff Tests

For more info on setting up and writing visual diff tests, you can checkout the [visual diff repo's README](https://github.com/BrightspaceUI/visual-diff).

## Current Dependency Versions

This action relies on the `@brightspace-ui/visual-diff`, `mocha` and `puppeteer` libraries. When those libraries are updated, it often results in minor changes to the visual diff images.

If you'd like to install the same versions the action is using locally, the specific versions currently used by the action are provided below:

```shell
npm install @brightspace-ui/visual-diff@7 mocha@9 puppeteer@13  --no-save
```
