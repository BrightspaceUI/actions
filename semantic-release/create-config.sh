IS_TRACKED=$(git ls-files package-lock.json || true)
if [ $IS_TRACKED != "" ]; then
  ASSETS="[\"package.json\", \"package-lock.json\"]"
else
  ASSETS="[\"package.json\"]"
fi
cat >$FILE_PATH <<EOL
{
  "branches": [
    "+([0-9])?(.{+([0-9]),x}).x",
    "$DEFAULT_BRANCH",
    "next",
    "next-major",
    {"name": "beta", "prerelease": true},
    {"name": "alpha", "prerelease": true}
  ]
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/github",
    [
      "@semantic-release/npm",
      {
        "npmPublish": $NPM
      }
    ],
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/git",
      {
        "assets": $ASSETS,
        "message": "chore(release): \${nextRelease.version} [skip ci]"
      }
    ]
  ]
}
EOL

cat $FILE_PATH
