# Prepare Translations for NPM Action

This GitHub action prepares translation files in a project for NPM publishing by creating temporary `en` translations for each language term and each language
in your project that doesn't yet have a proper translation.

## Using the Action

Typically this action is called from a release workflow before a step which publishes to NPM, such as the [semantic-release action](https://github.com/BrightspaceUI/actions/tree/master/semantic-release).


Here's a sample workflow:

```yml
name: Release
on:
  push:
    branches:
      - master
jobs:
  release:
    timeout-minutes: 2
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: Brightspace/third-party-actions@actions/checkout
        with:
          persist-credentials: false
      - name: Setup Node
        uses: Brightspace/third-party-actions@actions/setup-node
        with:
          node-version: 12.x
        # additional validation steps can be run here
      - name: Prepare Translations for NPM
        uses: BrightspaceUI/actions/prepare-translations-for-npm@master
        with:
          LANG_PATH: lang
        # NPM publishing step happens here
```

Options:
* `LANG_PATH` (default: `lang`): The relative path to your language files from the root of your repository

Notes:
* When setting up NodeJS, the version specified must be `>= 12`. This action uses features introduced in v12.
* If you have additional release validation steps (e.g. build step, validation tests), run them before the "Prepare Translations for NPM" step.
* You must run the checkout step before running the "Prepare Translations for NPM" step, otherwise the action will not be able to find your lang path.
* Don't run this action if you're not publishing to NPM. It doesn't commit to your repo and isn't relevant outside of publishing to NPM.
