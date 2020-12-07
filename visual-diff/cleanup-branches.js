#!/usr/bin/env node

const chalk = require('chalk');
const { Octokit } = require('@octokit/rest');

const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const branchPrefix = process.env['VISUAL_DIFF_BRANCH_PREFIX'];

const octokit = new Octokit({
	auth: process.env['GITHUB_TOKEN'],
	baseUrl: process.env['GITHUB_API_URL'],
	userAgent: `${process.env['GITHUB_WORKFLOW']}-visual-diff`
});

async function cleanupBranches() {
	console.log(`Coming soon... will cleanup ${branchPrefix}* branches.\n`);
}

cleanupBranches().catch((e) => {
	console.log(chalk.red(e));
	console.log(chalk.red('Could not cleanup orphaned visual diff branch(es).'));
});
