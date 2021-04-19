#!/usr/bin/env node

const chalk = require('chalk');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
	auth: process.env['GITHUB_TOKEN'],
	baseUrl: process.env['GITHUB_API_URL'],
	userAgent: `${process.env['GITHUB_WORKFLOW']}-visual-diff`
});

const fullRepo = process.env['GITHUB_REPOSITORY'];
const githubServer = process.env['GITHUB_SERVER_URL'];
const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const prBaseBranchName = process.env['PULL_REQUEST_BASE_BRANCH'];
const prNum = process.env['PULL_REQUEST_NUM'];
const runId = process.env['GITHUB_RUN_ID'];

async function handleGoldensConflict() {
	console.log('Adding comment to pull request about goldens conflict.\n');

	await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
		owner: owner,
		repo: repo,
		issue_number: prNum,
		body: `Could not generate new goldens - your code changes will update golden files that you do not have the latest version of.  Please rebase or merge \`${prBaseBranchName}\` into your branch.`
	});
}

async function handleIssues() {
	console.log('Adding comment to pull request about general issues.\n');

	await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
		owner: owner,
		repo: repo,
		issue_number: prNum,
		body: `Could not generate new goldens - please check the [GitHub Action run log](${githubServer}/${fullRepo}/actions/runs/${runId}) for errors.`
	});
}

if (process.env['GOLDENS_CONFLICT'] === 'true') {
	handleGoldensConflict().catch((e) => {
		console.log(chalk.red(e));
		console.log(chalk.red('Could not add comment about goldens conflict.'));
	});
} else {
	handleIssues().catch((e) => {
		console.log(chalk.red(e));
		console.log(chalk.red('Could not add comment about general issues.'));
	});
}
