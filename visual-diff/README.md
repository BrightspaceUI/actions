# Visual Diff Action

This GitHub action runs your repo's [visual diff tests](https://github.com/BrightspaceUI/visual-diff).  If the tests fail, a PR will be opened with the new goldens against the branch/PR that triggered the action.  If they pass, any open goldens PRs for that branch/PR will be closed for you.

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
        uses: BrightspaceUI/actions/visual-diff@master
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
* `GITHUB_TOKEN`: Token to use to open the goldens PR.  This does not need admin privileges, so you can use the standard `GITHUB_TOKEN` that exists automatically.
* `TEST_PATH` (default: `./{,!(node_modules)/**}/*.visual-diff.js`): Path passed into the mocha call defining the locations and name structure of the tests.
* `TEST_TIMEOUT` (default: `40000`): Test timeout passed into the mocha call.

Notes:
* You can also run this action in your release workflow to confirm the `master` branch is in a good state before releasing.  If there's a problem, a PR will be opened against `master` to get the goldens back in the expected state.  This mostly comes down to a time versus risk trade-off - the risk of things getting out of sync may be lower than the time taken to run your visual diff tests every release.
* You can use the standard `GITHUB_TOKEN` that exists automatically, but will need to [setup the AWS secrets](#setting-up-aws-access-creds).

## Setting Up AWS Access Creds

In order to have the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` available to you, you will need to register your repo in [`iam-build-tokens`](https://github.com/Brightspace/iam-build-tokens).  The role you want to assume already exists, so you only need to worry about "signing up" to receive rotating tokens for it.  We are using [hub roles](https://github.com/Brightspace/iam-build-tokens/blob/master/docs/howto-hub-roles.md#create-hub-role) for this, in case your repo needs (or will one day need) access to multiple roles.

Specifically, you will need to add the following to [https://github.com/Brightspace/iam-build-tokens/tree/master/terraform/roles](https://github.com/Brightspace/iam-build-tokens/tree/master/terraform/roles):
```
module "<github_repo_name>" {
  source = "../modules/githubactions/hub-role"

  assumable_role_arns = [
    # Dev-UiPlatform
    "arn:aws:iam::037018655140:role/visual-diff-githubactions-access",
  ]

  githubactions_project = "<github_repo_name>"
  githubactions_org = "<github_org_name>"
}
```

Once you've merged the above, you'll see the new secrets in your repo within a few minutes!  These tokens will be rotated automatically for you.

Notes:
* You can register multiple repos in the same file, so we've created [`brightspace-ui.tf`](https://github.com/Brightspace/iam-build-tokens/blob/master/terraform/roles/brightspace-ui.tf), [`brightspace-ui-labs.tf`](https://github.com/Brightspace/iam-build-tokens/blob/master/terraform/roles/brightspace-ui-labs.tf) and [`brightspace-hypermedia-components.tf`](https://github.com/Brightspace/iam-build-tokens/blob/master/terraform/roles/brightspace-hypermedia-components.tf) to help organize. Project repos can decide how they'd like to organize.
* Remember after merging to [apply your terraform changes](https://github.com/Brightspace/iam-build-tokens/blob/master/docs/howto-terraform.md)!

## Writing Visual Diff Tests

For more info on setting up and writing visual diff tests, you can checkout the [visual diff repo's README](https://github.com/BrightspaceUI/visual-diff).
