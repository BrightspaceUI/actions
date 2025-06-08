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

### Inputs

#### Action Configuration

* `draft-pr` (default: `true`)
Open the translation formatting PR as a draft PR

* `github-token` (required)
Token used to cleanup branches and open the translation formatting PR. This does not need admin privileges, so the standard `GITHUB_TOKEN` that's available can be used.

* `t9n-branch-prefix` (default: `ghworkflow/translation`)
Prefix for translation formatting branches

#### `messageformat-validator` Configuration

* `t9n-source`
The locale to use as the source for comparisons

* `t9n-path`
A glob path to the directory containing translation files

* `t9n-locales`
A comma-separated list of locales to limit all operations to

#### Message Formatting:

* `t9n-newlines` (default: `false`)
When formatting complex arguments, use newlines and indentation for readability

* `t9n-remove` (default: `true`)
Remove cases for unsupported plural and selectordinal categories

* `t9n-trim` (default: `true`)
Trim whitespace from both ends of messages

* `t9n-quotes` (default: `straight`)
Replace quote characters with locale-appropriate characters ("source", "straight", or "both")

> [!WARNING]
> Use these options with extreme caution. If you don't understand the implications, you shouldn't use them.
>
> * `t9n-add` (default: `false`)
> Add cases for supported but missing plural and selectordinal categories
>
> * `t9n-dedupe` (default: `false`)
> Remove complex argument cases that duplicate the `other` case. Takes precedence over `t9n-add`.

#### File Formatting

* `t9n-sync` (default: `true`)
Sync messages between source and target locales

* `t9n-sort` (default: `true`)
Sort messages alphabetically by key, maintaining any blocks

See the [`messageformat-validator` repo's README](https://github.com/bearfriend/messageformat-validator) to learn more about these flags.

**Notes:**
* You can use the standard `GITHUB_TOKEN` that exists automatically in your repository's secrets
* Options in an `mfv.config.json` file will be respected if not overridden by a corresponding input
