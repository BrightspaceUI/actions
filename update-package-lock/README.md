# Update `package-lock.json` Action

This GitHub action will determine if any updates can be made to your repo's `package-lock.json`. If so, a PR will be opened with the updates against the repo's default release branch. You can also configure this action to auto-approve the PR for you, and set it to auto-merge after tests pass.

## Using the Action

Typically this action would be scheduled to run on whatever cadence works well for your repo. Our [brightspace-integration repo](https://github.com/Brightspace/brightspace-integration) runs it hourly to catch new changes across all our web components, whereas a regular project repo may only want to run it once a day or once a week.

This action provides similar functionality to what dependabot gives you, but will combine all changes in one PR and can be set to automerge if all tests pass. It also will not change the `package.json` file, only handling updates that fall within the range you've set there. This means the action can provide a nice compliment to dependabot - it can handle all the "easy" updates for you automatically, so your time is mostly spent on reviewing/debugging major updates and breaking changes.

Here's a sample workflow:

```yml
name: Update package-lock.json
on:
  schedule:
    - cron: "0 15 * * 1-5" # Mon-Fri 11:00AM EDT. 10:00AM EST.
jobs:
  test:
    timeout-minutes: 10
    runs-on: ubuntu-latest
    steps:
      - uses: Brightspace/third-party-actions@actions/checkout
        with:
          persist-credentials: false
      - uses: Brightspace/third-party-actions@actions/setup-node
        with:
          node-version: '14'
      - name: Update package-lock.json
        uses: BrightspaceUI/actions/update-package-lock@main
        with:
          GITHUB_TOKEN: ${{ secrets.D2L_GITHUB_TOKEN }}
```

Options:
* `APPROVAL_TOKEN`: Token to auto-approve the PR after opening. If no token is passed, the auto-approval will be skipped. See [setup details](#setting-up-auto-approval) below.
* `AUTO_MERGE_TOKEN`: Token to enable auto-merge on the PR. If no token is passed, the auto-merge will be skipped. See [setup details](#setting-up-auto-merge) below.
* `BRANCH_NAME` (default: `ghworkflow/package_lock_auto_update`): Name of the branch to add the changes to and open the pull request from.
* `COMMIT_MESSAGE` (default: `Auto Update Dependencies`): Commit message for the changes.
* `DEFAULT_BRANCH` (default: `main`): Name of the default release branch for your repo.
* `GITHUB_TOKEN` (required): Token for opening the updates PR. See [setup details](#setting-github-token) below.
* `PR_TITLE` (default: `Updating package-lock.json`): Title for the opened pull request.

## Setting GITHUB_TOKEN

The `GITHUB_TOKEN` is used to open the PR with the `package-lock.json` updates. This token does not need admin privileges, so the standard `secrets.GITHUB_TOKEN` _can_ work.  However, that token [does not trigger additional workflows](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#using-the-github_token-in-a-workflow).  If you use GitHub actions for your CI, you probably want to use `D2L_GITHUB_TOKEN` here instead.  You'll also need to make sure `persist-credentials: false` is set like in the example workflow above.

[Learn more about the D2L_GITHUB_TOKEN...](../docs/branch-protection.md)

## Setting Up Auto Approval

Automatically approving the PR is an optional enhancement this action can handle for you by setting an `APPROVAL_TOKEN`. The `APPROVAL_TOKEN` needs to be _different_ than the `GITHUB_TOKEN` because a token cannot approve its own PR. If you used `D2L_GITHUB_TOKEN` to open the PR, you can use `GITHUB_TOKEN` to approve it, and vice versa.

Note: This functionality may not be helpful to you if you require CODEOWNERS approval to merge.  You could consider removing CODEOWNERS for the `package-lock.json` file specifically.

## Setting Up Auto Merge

Setting the PR to auto-merge is another optional enhancement of this action. Requirements for auto merge to work are:
* Auto merge needs to be enabled [at the repository level](https://docs.github.com/en/github/administering-a-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository)
* Branch protection needs to be on for the default release branch, and enforces "Require pull request reviews before merging" or "Require status checks to pass before merging" or something similar. This is because auto-merge only works for cases where PRs cannot be merged immediately after opening.
* While not required, it's highly recommended to [enable "Automatically delete head branches"](https://docs.github.com/en/github/administering-a-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches) before using auto-merge, to help cleanup branches after they are automatically merged.

Like with [setting the `GITHUB_TOKEN` above](#setting-github-token), setting `AUTO_MERGE_TOKEN` to `secrets.GITHUB_TOKEN` will work, but will not trigger any "push" workflows you've setup to run after a merge to your default branch.  If you _do_ need those triggered, you'll want to use `D2L_GITHUB_TOKEN`.
