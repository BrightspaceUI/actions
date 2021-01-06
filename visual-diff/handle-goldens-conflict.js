#!/usr/bin/env node

const chalk = require('chalk');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
	auth: process.env['GITHUB_TOKEN'],
	baseUrl: process.env['GITHUB_API_URL'],
	userAgent: `${process.env['GITHUB_WORKFLOW']}-visual-diff`
});

const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const prBaseBranchName = process.env['PULL_REQUEST_BASE_BRANCH'];
const prNum = process.env['PULL_REQUEST_NUM'];

async function handleGoldensConflict() {
	console.log('Adding comment to pull request about goldens conflict.\n');

	await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
		owner: owner,
		repo: repo,
		issue_number: prNum,
		body: `Could not generate new goldens - your code changes will update golden files that you do not have the latest version of.  Please rebase or merge \`${prBaseBranchName}\` into your branch.`
	});
}

handleGoldensConflict().catch((e) => {
	console.log(chalk.red(e));
	console.log(chalk.red('Could not handle goldens conflict.'));
});
