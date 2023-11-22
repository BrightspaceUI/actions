# Token for Release Workflows

**The below is how you should configure your release workflow in the `BrightspaceUI`, `BrightspaceUILabs` and `BrightspaceHypermediaComponents` orgs. The `Brightspace` org is coming soon - for now, use the [branch protection steps](./branch-protection.md).**

Included in the [semantic-release](../semantic-release/), [incremental-release](../incremental-release), and [match-lms-release](https://github.com/Brightspace/lms-version-actions/tree/main/match-lms-release) workflows is a step which updates the version in the repo's `package.json` file to match the newly released version. This step will fail with the built-in `GITHUB_TOKEN` because it cannot bypass the org-level ruleset requirement that all changes have a pull request before merging.

To work around this, the repo needs to be setup with a special `D2L_RELEASE_TOKEN`. This uses a GitHub app allowed to bypass the restriction.

To set up this bypass:

1. Ensure the repo's protected branches are configured using a repository ruleset, not a branch protection rule.

    This should be configured in [`repo-settings`](https://github.com/Brightspace/repo-settings). [Here are `BrightspaceUI/core`'s rules](https://github.com/Brightspace/repo-settings/blob/main/repositories/github/BrightspaceUI/core.yaml#L14-L43) as an example.
    
    Branch protection rules do not allow apps to bypass status checks, and GitHub is not adding any new features to them because rulesets is the replacement. The old branch protection rules will need to be deleted for the release action to work.

2. Configure the repo to have access to a rotating `D2L_RELEASE_TOKEN`.

    This is also configured in `repo-settings`, by adding `release_action_setup: true` to the repo config. This will set a token with the proper permissions as a secret named `D2L_RELEASE_TOKEN`, and add the token's app to the bypass list of all rulesets configured by `repo-settings`.
    
    Check out the [docs](https://github.com/Brightspace/repo-settings/blob/main/docs/release_action_setup.md) for more information.

3. Set `persist-credentials` to `false` in the checkout step:

    ```yml
    - name: Checkout
      uses: Brightspace/third-party-actions@actions/checkout
      with:
        persist-credentials: false
    ```

    This tells GitHub Actions not to set up the default `GITHUB_TOKEN`.

4. Pass in `D2L_RELEASE_TOKEN` as the `GITHUB_TOKEN` environment variable to the release step:

    ```yml
    - name: Semantic/Incremental/LMS Release
      uses: BrightspaceUI/actions/semantic-release@main (or incremental-release or match-lms-release)
      with:
        GITHUB_TOKEN: ${{ secrets.D2L_RELEASE_TOKEN }}
    ```

That should do it!
