#!/usr/bin/env node

import chalk from 'chalk';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
	auth: process.env['GITHUB_TOKEN'],
	baseUrl: process.env['GITHUB_API_URL'],
	userAgent: `${process.env['GITHUB_WORKFLOW']}-visual-diff`
});

const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const branchPrefix = process.env['VISUAL_DIFF_BRANCH_PREFIX'];

async function cleanupBranches() {
	const visualDiffBranches = await octokit.request('GET /repos/{owner}/{repo}/git/matching-refs/{ref}', {
		owner: owner,
		repo: repo,
		ref: `heads/${branchPrefix}`
	});

	for (let i = 0; i < visualDiffBranches.data.length; i++) {
		const branch = visualDiffBranches.data[i].ref;
		const prNum = branch.slice(branch.lastIndexOf('-') + 1);

		let prInfo,
			prOpen = true;
		try {
			prInfo = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
				owner: owner,
				repo: repo,
				pull_number: prNum
			});

			if (prInfo.data.state !== 'open') {
				prOpen = false;
			}
		} catch (e) {
			console.log(chalk.red(e));
			console.log(chalk.red(`Could not get details for PR #${prNum} - skipping branch ${branch}.`));
			continue;
		}

		if (!prOpen) {
			console.log(`PR #${prNum} is no longer open - deleting branch ${branch}.\n`);
			try {
				await octokit.request('DELETE /repos/{owner}/{repo}/git/refs/{ref}', {
					owner: owner,
					repo: repo,
					ref: branch.substring(5)
				});
			} catch (e) {
				console.log(chalk.red(e));
				console.log(chalk.red(`Could not delete branch ${branch}.`));
			}
		}
	}

	console.log('Done processing visual-diff branches.\n');
}

cleanupBranches().catch((e) => {
	console.log(chalk.red(e));
	console.log(chalk.red('Could not cleanup orphaned visual diff branch(es).'));
});
