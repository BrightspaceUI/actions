# Branch Protection and Release Workflows

Included in both the [semantic-release](../semantic-release/) and [incremental-release](../incremental-release) workflows is a step which updates the version in your repo's `package.json` file to match the newly released version. This step will fail with the built-in `GITHUB_TOKEN` if your repo has branch protection rules that prevent commits outside of pull requests.

To work around this, we use a special `D2L_GITHUB_TOKEN`.

To set up this bypass:

1) Ensure that `D2L_GITHUB_TOKEN` is a secret available to your repo

For repos in `Brightspace`, `BrightspaceUI`, `BrightspaceUILabs` and `BrightspaceHypermediaComponents` this secret will already be available org-wide.

We plan to automate the configuration and rotation of this secret in the future.

2) Configure access to the `brightspace-bot`

This is also a temporary step, but make sure that the `brightspace-bot` GitHub account has Admin access to your repo.

Also double-check that your branch protection doesn't include a rule to "Include Administrators".

3) Set `persists-credentials` to `false` in the checkout step:

```yml
name: Checkout
  uses: Brightspace/third-party-actions@actions/checkout
  with:
    persist-credentials: false
```

This tells GitHub Actions not to set up the default `GITHUB_TOKEN`.

4) Pass in `D2L_GITHUB_TOKEN` as the `GITHUB_TOKEN` environment variable to the release step:

```yml
- name: Semantic/Incremental Release
  uses: BrightspaceUI/actions/semantic-release@master (or incremental-release)
  with:
    GITHUB_TOKEN: ${{ secrets.D2L_GITHUB_TOKEN }}
```

That should do it!
