NPM_STEP=""
if [ "$NPM" = "true" ]
then
  NPM_STEP=$'\n    "@semantic-release/npm",'
fi
cat >$FILE_PATH <<EOL
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/github",$NPM_STEP
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/git",
      {
        "assets": [
          "package.json"
        ],
        "message": "chore(release): \${nextRelease.version} [skip ci]"
      }
    ]
  ]
}
EOL

cat $FILE_PATH