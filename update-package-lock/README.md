# Update `package-lock.json` Action

This GitHub action will determine if any updates can be made to your repo's `package-lock.json`. If so, a PR will be opened with the updates against the repo's default release branch. You can also configure this action to auto-approve the PR for you, and set it to auto-merge after tests pass.

## Using the Action

Typically this action would be scheduled to run on whatever cadence works well for your repo. Our [brightspace-integration repo](https://github.com/Brightspace/brightspace-integration) runs it hourly to catch new changes across all our web components, whereas a regular project repo may only want to run it once a day or once a week.

This action provides similar functionality to what dependabot gives you, but will combine all changes in one PR and can be set to automerge if all tests pass. It also will not change the `package.json` file, only handling updates that fall within the range you've set there. This means the action can provide a nice compliment to dependabot - it can handle all the "easy" updates for you automatically, so your time is mostly spent on reviewing/debugging major updates and breaking changes. See the [recommended Dependabot setup](#recommended-dependabot-setup) section below for an example configuration.

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
          token: ${{ secrets.MY_GITHUB_TOKEN }}
      - uses: Brightspace/third-party-actions@actions/setup-node
        with:
          node-version-file: .nvmrc
      - name: Update package-lock.json
        uses: BrightspaceUI/actions/update-package-lock@main
        with:
          GITHUB_TOKEN: ${{ secrets.MY_GITHUB_TOKEN }}
```

Options:
* `APPROVAL_TOKEN`: Token to auto-approve the PR after opening. If no token is passed, the auto-approval will be skipped. See [setup details](#setting-up-auto-approval) below.
* `AUTO_MERGE_TOKEN`: Token to enable auto-merge on the PR. If no token is passed, the auto-merge will be skipped. See [setup details](#setting-up-auto-merge) below.
* `AUTO_MERGE_METHOD`: (default: `merge`): Merge method to use when enabling auto-merge. Can be one of `merge`, `squash` or `rebase`.
* `BRANCH_NAME` (default: `ghworkflow/package_lock_auto_update`): Name of the branch to add the changes to and open the pull request from.
* `NODE_AUTH_TOKEN`: Token for reading packages from already setup private registry. Do not use with `CODEARTIFACT_AUTH_TOKEN`, use [codeartifact-actions/npm/add-registry](https://github.com/Brightspace/codeartifact-actions/tree/master/npm) to setup the needed token before this action is run.
* `COMMIT_MESSAGE` (default: `Auto Update Dependencies`): Commit message for the changes.
* `DEFAULT_BRANCH` (default: `main`): Name of the default release branch for your repo.
* `GITHUB_TOKEN` (required): Token for opening the updates PR. See [setup details](#setting-github-token) below.
* `PR_TITLE` (default: `Updating package-lock.json`): Title for the opened pull request.
* `SLACK_CHANNEL_FAILURE`: Optional slack channel to send action failures to. See [setup details](#setting-up-slack-notifications) below.
* `SLACK_CHANNEL_STALE_PR`: Optional slack channel to send stale PR warnings to. A message will be sent if the action updates a PR that has been open for more than 3 days. See [setup details](#setting-up-slack-notifications) below.
* `SLACK_TOKEN`: Slack token for enabling slack notifications. Only needed if `SLACK_CHANNEL_FAILURE` and/or `SLACK_CHANNEL_STALE_PR` is set. See [setup details](#setting-up-slack-notifications) below.
* `WORKING_DIRECTORY` (default: `.`): The directory to perform all actions within. Useful for repositories with more then one `package-lock.json`.

## Setting GITHUB_TOKEN

The `GITHUB_TOKEN` is used to open the PR with the `package-lock.json` updates. This token does not need admin privileges, so the standard `secrets.GITHUB_TOKEN` _can_ work.  However, that token [does not trigger additional workflows](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#using-the-github_token-in-a-workflow).  If you use GitHub actions for your CI, you'll want to set up a rotating GitHub token with `contents: write` and `pull_requests: write` permissions in [`repo-settings`](https://github.com/Brightspace/repo-settings) to use instead.  You'll also need to set `token` to your custom token in the `checkout` step, like in the example workflow above.

[Learn more about setting up a token with `repo-settings`](https://github.com/Brightspace/repo-settings/blob/main/docs/github-api-tokens.md) and [see an example...](https://github.com/Brightspace/repo-settings/blob/ffc5ff046e6ccda7044e4c5ae7a60f1f290efb7f/repositories/github/BrightspaceUI/core.yaml#L7-L14)

## Setting Up Auto Approval

Automatically approving the PR is an optional enhancement this action can handle for you by setting an `APPROVAL_TOKEN`. The `APPROVAL_TOKEN` needs to be _different_ than the `GITHUB_TOKEN` because a token cannot approve its own PR. If you used a custom token from `repo-settings` to open the PR, you can use `GITHUB_TOKEN` to approve it, and vice versa.

Note: This functionality may not be helpful to you if you require CODEOWNERS approval to merge.  You could consider removing CODEOWNERS for the `package-lock.json` file specifically by adding `package-lock.json` to CODEOWNERS with no owner beside it:

```
* @Brightspace/your-team
package-lock.json
```

## Setting Up Auto-Merge

Setting the PR to auto-merge is another optional enhancement of this action. Requirements for auto merge to work are:
* Auto merge needs to be enabled [at the repository level](https://docs.github.com/en/github/administering-a-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository)
* Branch protection needs to be on for the default release branch, and enforces "Require pull request reviews before merging" or "Require status checks to pass before merging" or something similar. This is because auto-merge only works for cases where PRs cannot be merged immediately after opening.
* While not required, it's highly recommended to [enable "Automatically delete head branches"](https://docs.github.com/en/github/administering-a-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches) before using auto-merge, to help cleanup branches after they are automatically merged.

Like with [setting the `GITHUB_TOKEN` above](#setting-github-token), setting `AUTO_MERGE_TOKEN` to `secrets.GITHUB_TOKEN` will work, but will not trigger any "push" workflows you've setup to run after a merge to your default branch.  If you _do_ need those triggered, you'll want to use your custom token.

### Auto-Merge Method

When using `AUTO_MERGE_METHOD` you must make sure the repository allows the method of merge selected, otherwise enabling auto merge will fail. By default all new repositories allow `merge` as the merge method hence the default for `AUTO_MERGE_METHOD`. For the merge method `squash` the commit message will be determined by the [squash commit message setting](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests) you have selected.

## Setting up slack notifications

You can receive slack notifications if the `update-package-lock` action fails (by setting `SLACK_CHANNEL_FAILURE`) or if the update PR is getting stale (by setting `SLACK_CHANNEL_STALE_PR`). This can be helpful if you are using auto-approval and auto-merge, and CODEOWNERS are not added to these PRs.

If you set either of these inputs, you'll need to pass the `D2L_SLACK_TOKEN` secret to the `SLACK_TOKEN` input:
```
        with:
          SLACK_CHANNEL_FAILURE: '#my-channel'
          SLACK_CHANNEL_STALE_PR: '#my-other-channel'
          SLACK_TOKEN: ${{ secrets.D2L_SLACK_TOKEN }}
```

For your repo to have access to `D2L_SLACK_TOKEN`, you'll need to set this up in [`repo-settings`](https://github.com/Brightspace/repo-settings/blob/main/docs/slack.md).

Also, remember to add the GitHub Actions Slack app to your channel's integrations. If you forget to do this, you'll see an error like: `Error: An API error occurred: not_in_channel`.

## Recommended Dependabot Setup

Dependabot has a [cooldown feature](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#cooldown) that works well with the `update-package-lock` workflow. The cooldown delays when Dependabot opens PRs for new versions, giving this workflow time to handle minor and patch updates automatically first.

dependabot.yml:
```yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      # update-package-lock workflow handles minor/patch updates - delay for a few weeks to give time to handle breaking changes in those PRs
      default-days: 25
      semver-major-days: 5
```

This delays Dependabot PRs for minor/patch updates for 25 days (letting `update-package-lock` handle them and giving you time to investigate and fix test/vdiff failures), while opening major version PRs after 5 days (for manual review) and security updates immediately.
