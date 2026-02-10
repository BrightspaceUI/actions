# vdiff Action

This GitHub action runs a repo's [vdiff tests](https://github.com/BrightspaceUI/testing#vdiff-testing). If the tests fail, a draft PR will be opened with the new goldens against the branch/PR that triggered the action. If they pass, any open golden PRs for that branch/PR will be closed.

More specifically, this action will:
* Cleanup abandoned golden PRs
* Grab the current golden images and set them up for the test run
* Run the vdiff tests and display the results in a custom commit status (including error messages, a link to the golden PR, etc.)
  * If failures occur, it will open/update the corresponding golden PR with the new goldens and link to the report
  * If the tests pass, it will close the corresponding golden PR if it exists

## Using the Action

Typically this action is triggered from a workflow that runs on pull requests, ensuring that new code changes did not cause unexpected visual changes before they are merged.

Here's a sample workflow:

```yml
name: vdiff
on: pull_request
jobs:
  vdiff:
    timeout-minutes: 10
    runs-on: ubuntu-latest
    steps:
      - uses: Brightspace/third-party-actions@actions/checkout
      - uses: Brightspace/setup-node@main
        with:
          node-version-file: .nvmrc
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: vdiff Tests
        uses: BrightspaceUI/actions/vdiff@main
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

General Inputs:
* `aws-access-key-id`: Access key id for the role that will assume the vdiff role - see [setup details](#setting-up-aws-access-creds) below.
* `aws-secret-access-key`: Access key secret for the role that will assume the vdiff role - see [setup details](#setting-up-aws-access-creds) below.
* `aws-session-token`: Session token for the role that will assume the vdiff role - see [setup details](#setting-up-aws-access-creds) below.
* `draft-pr` (default: `true`): Whether to open the golden PR as a draft PR.
* `github-token`: Token used to cleanup branches and open the golden PR. This does not need admin privileges, so the standard `GITHUB_TOKEN` that's available can be used.
* `vdiff-branch-prefix` (default: `ghworkflow/vdiff`): Prefix for vdiff branches.

`d2l-test-runner` Inputs:
* `test-chrome`: Set `--chrome` flag to run vdiff tests in Chromium. If no browser flags are set, the default `d2l-test-runner` browser(s) for `vdiff` will be used.
* `test-config`: Set `--config` flag with `d2l-test-runner` config location.
* `test-files`: Set the `--files` flag with the pattern of vdiff tests to run.
* `test-firefox`: Set `--firefox` flag to run vdiff tests in Firefox. If no browser flags are set, the default `d2l-test-runner` browser(s) for `vdiff` will be used.
* `test-safari`: Set `--safari` flag to run vdiff tests in Webkit. If no browser flags are set, the default `d2l-test-runner` browser(s) for `vdiff` will be used.
* `test-timeout`: Set the `--timeout` flag with the timeout threshold for vdiff tests (in ms).

See the [`@brightspace-ui/testing` repo's README](https://github.com/BrightspaceUI/testing#running-tests) to learn more about these flags.

**Notes:**
* You can also run this action in the release workflow to confirm the `main` branch is in a good state before releasing.  If there's a problem, a PR will be opened against `main` to get the goldens back in the expected state.  This mostly comes down to a time versus risk trade-off - the risk of things getting out of sync may be lower than the time taken to run the vdiff tests every release.
* You can use the standard `GITHUB_TOKEN` that exists automatically, but will need to [set up the AWS secrets](#setting-up-aws-access-creds).

## Setting Up AWS Access Creds

In order to have the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` secrets available in a repo, [add that to the repo's setup in repo-settings](https://github.com/Brightspace/repo-settings/blob/main/docs/vdiff.md).

## Removing CODEOWNER Restrictions for Golden PRs

If the repo has a `CODEOWNERS` file, it may not be desirable to have the vdiff pull requests set up with the same restrictions as other PRs. Golden PRs are usually opened against a branch that will be reviewed later by a code owner anyways. To remove the code owner restriction on these golden PRs, add the following to the `CODEOWNERS` file:

```
*       @<some_team> <some_username>
golden/
.vdiff.json
```

## Writing Visual Diff Tests

For more info on setting up and writing vdiff tests, refer to the [@brightspace-ui/testing repo documentation](https://github.com/BrightspaceUI/testing#vdiff-testing).

## Using with `package-lock.json`

New versions of `@brightspace-ui/testing` may include bumps to the browser versions running the tests. When those are updated, it often results in minor changes to the visual diff images.

To avoid blocking all PRs when the library updates until the new goldens are investigated and merged, we recommend committing the `package-lock.json` file and [setting up the `update-package-lock` workflow](../update-package-lock) to keep it up to date.
