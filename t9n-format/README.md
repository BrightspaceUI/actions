# Translation Action

This GitHub action runs [messageformat-validator's `format`](https://github.com/bearfriend/messageformat-validator#format) command. If formatting produces changes, a draft PR will be opened against the branch/PR that triggered the action. If there are no changes, any open formatting PRs for that branch/PR will be closed.

More specifically, this action will:
* Cleanup abandoned formatting PRs
* Run `mfv format` and display the results in a custom commit status (including error messages, a link to the formatting PR, etc.)
  * If changes are produced, it will open/update the corresponding formatting PR with various types of changes in separate commits
  * If there are no changes, it will close the corresponding formatting PR if it exists

## Using the Action

Typically this action is triggered from a workflow that runs on pull requests when translation files are changed, ensuring the changes are formatted properly before they are merged.

Here's a sample workflow:

```yml
name: translation
on:
  pull_request:
    paths:
      - 'src/lang/*'

jobs:
  format:
    timeout-minutes: 5
    runs-on: ubuntu-latest
    steps:
      - uses: Brightspace/third-party-actions@actions/checkout
      - uses: Brightspace/third-party-actions@actions/setup-node
        with:
          node-version-file: .nvmrc
          cache: 'npm'
      - name: Install dependencies
        run: npm i
      - name: Run formatter
        uses: BrightspaceUI/actions/t9n-format@main
        with:
          t9n-newlines: true
          github-token: ${{ secrets.GITHUB_TOKEN }}

```

### General Inputs:

* `draft-pr` (default: `true`): Whether to open the translation formatting PR as a draft PR.
* `github-token`: Token used to cleanup branches and open the translation formatting PR. This does not need admin privileges, so the standard `GITHUB_TOKEN` that's available can be used.
* `t9n-branch-prefix` (default: `ghworkflow/translation`): Prefix for translation formatting branches.

### `messageformat-validator` Inputs:

* `t9n-newlines`: When formatting complex arguments, use newlines and indentation for readability
<!-- * `t9n-add`: Add cases for missing but supported plural and selectordinal categories -->
* `t9n-remove` (default: `true`): Remove cases for unsupported plural and selectordinal categories
<!--* `t9n-dedupe`: Remove complex argument cases that duplicate the `other` case. Takes precedence over --add.-->
* `t9n-trim` (default: `true`): Trim whitespace from both ends of messages
* `t9n-quotes` (default: `straight`): Replace quote characters with locale-appropriate characters ("source", "straight", or "both")
<!-- * `t9n-sort`: Sort translations by key -->

<br>

* `t9n-source`: The locale to use as the source for comparisons
* `t9n-path`: A glob path to the directory containing translation files
* `t9n-locales` (default: '' [all]): Comma-separated list of locales to format

See the [`messageformat-validator` repo's README](https://github.com/bearfriend/messageformat-validator) to learn more about these flags.

**Notes:**
* You can use the standard `GITHUB_TOKEN` that exists automatically in your repository's secrets.
* Options in an `mfv.config.json` file will be respected if not re-declared via a corresponding input
