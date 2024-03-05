# Comment On PR Action

This GitHub action uses the [GitHub REST API](https://octokit.github.io/rest.js/v19#issues-create-comment) to add a comment to the current PR as the `github-actions` user, with an option to only post once per PR.

## Using the Action

This action **can only be used on `pull_request` event types**, since it posts to the PR that triggers the action. It can be used to write any comment, and can be combined with other steps in your workflow to convey information from your CI process.

In situations where you only want to post once on a given PR, use `only-post-once: true`. Every comment from this action includes a hidden key in an HTML comment, which is used by `only-post-once` to detect if a post has already been created. Use `unique-key` to specify your own unique key, which can be useful e.g. if you want to uniquely post two different comments. If you want to keep posting updated content using `hid-previous` will make sure to hide your previous comment before posting new content.

> [!NOTE]
> The `only-post-once` and `hide-previous` can not be used together. If you use `only-post-once` and `hide-previous` the comment will only be posted once.

Here's a sample workflow for a comment that you only want posted once:

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

            This is a sample multi-line comment that will only be posted once.
          only-post-once: true
```

And for a comment that you want to keep updating but hide older versions.

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

            This is a sample multi-line comment that will keep being posted.
          hide-previous: true
```

Options:

* `message` (required): The message to display
* `only-post-once` (default: `false`): Check whether the current message has already been posted before posting again
* `hide-previous` (default: `false`): Hide previous comment that matches the unique-key given and post new version of comment content
* `unique-key` (default: `"gh-actions_comment-on-pr"`): A unique key attached invisibly to the comment, for use with the `only-post-once` or `hide-previous` option
