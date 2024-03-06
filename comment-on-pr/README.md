# Comment On PR Action

This GitHub action uses the [GitHub REST API](https://octokit.github.io/rest.js/v19#issues-create-comment) to add a comment to the current PR as the `github-actions` user, with an option to only post once per PR.

## Using the Action

This action can be used to write any comment to any pull request, and can be combined with other steps in your workflow to convey information from your CI process.

Here's a simple example of posting a comment onto a pull request.

```yml
name: Comment
on: pull_request
jobs:
  comment:
    timeout-minutes: 5
    runs-on: ubuntu-latest
    steps:
      - name: Comment on PR
        uses: BrightspaceUI/actions/comment-on-pr@main
        with:
          message: |
            Thanks for the PR! 🎉

            This is a sample multi-line comment.
          post-mode: once
```

### Options

* `message` (required): The message to display
* `post-mode` (default: `always`): How posting of the comment will be handled. Options are `always`, `once`, `hide-previous` or `update`. See [below](#post-mode) for details
* `only-post-once` (default: `false`): This option is deprecated and should not be used going forward. Kept for backward compatibility. Will be removed in the future
* `unique-key` (default: `"gh-actions_comment-on-pr"`): A unique key attached invisibly to the comment, for use with the `post-mode` option
* `pull-request-number` (default: `${{github.event.pull_request.number}}`): The number of the pull request to post the comment to. If running within a pull request context this does not need to be supplied. If running outside of this context it is required.

#### Post Mode

Every comment from this action includes a hidden key in an HTML comment, which is used by `post-mode` to detect if a post has already been created. Use `unique-key` to specify your own unique key, which can be useful e.g. if you want to uniquely post two different comments.

* `always`: This will result in a comment always being posted to the pull request. This is the default mode
* `once`: The first time the action is run it will post the comment but in subsequent runs it will not post anything
* `hide-previous`: This will always look for a previous comment with the specified `unique-key` and hide it before posting a new comment with the most recent content
* `update`: This will find a previous comment with the specified `unique-key` and update the contents of the comment
