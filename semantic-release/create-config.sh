cat >$FILE_PATH <<EOL
{
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