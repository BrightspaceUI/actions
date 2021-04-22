#!/usr/bin/env node

const chalk = require('chalk');
const { Octokit } = require('@octokit/rest');

const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const actor = process.env['GITHUB_ACTOR'];
const prNum = process.env['PULL_REQUEST_NUM'];
const sourceBranchName = process.env['SOURCE_BRANCH'];
const goldensBranchName = process.env['VISUAL_DIFF_BRANCH'];

const octokit = new Octokit({
	auth: process.env['GITHUB_TOKEN'],
	baseUrl: process.env['GITHUB_API_URL'],
	userAgent: `${process.env['GITHUB_WORKFLOW']}-visual-diff`
});

function createPRBody() {
	let body = `This pull request updates the visual-diff golden images for ${prNum ? `the changes in pull request #${prNum}.` : `branch \`${sourceBranchName}\`.`}`;
	if (!process.env['FAILED_REPORTS']) {
		return body;
	}

	body = body + '\n\nPlease review the following failed reports closely before merging to ensure the visual differences are expected.';
	body = body + '\n\nFailed Reports:';
	const links = process.env['FAILED_REPORTS'].split(',');
	const formattedLinks = links.reduce((combined, link) => {
		const name = link.split('/');
		return combined + `\n- [${name[name.length - 2]}](${link})`;
	}, '');
	return body + formattedLinks;
}

async function handlePR() {
	if (prNum) {
		console.log(chalk.blue('\nTests triggered by PR - Verifying PR information'));

		let prInfo;
		try {
			prInfo = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
				owner: owner,
				repo: repo,
				pull_number: prNum
			});
		} catch (e) {
			console.log(chalk.red(`Could not find PR (${prNum}) that triggered the visual-diff test run`));
			return Promise.reject(e);
		}

		if (prInfo.data.head.ref !== sourceBranchName) {
			return Promise.reject('Branch name does not match what is expected.');
		} else if (prInfo.data.state !== 'open') {
			return Promise.reject('PR that triggered the visual-diff test run is no longer open.');
		}
		console.log(`New goldens are for PR #${prNum} (branch: ${sourceBranchName})`);
	} else {
		console.log(chalk.blue('\nTests triggered by push to branch - Verifying branch information'));
		try {
			await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
				owner: owner,
				repo: repo,
				branch: sourceBranchName
			});
		} catch (e) {
			console.log(chalk.red(`Could not find branch (${sourceBranchName}) that triggered the visual-diff test run.`));
			return Promise.reject(e);
		}
		console.log(`New goldens are for branch ${sourceBranchName}`);
	}

	console.log(chalk.blue('\nChecking For Existing Goldens PR'));

	const goldenPRs = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
		owner: owner,
		repo: repo,
		head: `${owner}:refs/heads/${goldensBranchName}`,
		base: `refs/heads/${sourceBranchName}`
	});

	let goldenPrNum;
	if (goldenPRs.data.length === 0) {
		console.log('Goldens PR does not exist');
		console.log(chalk.blue('\nOpening new goldens PR'));
		const newPR = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
			owner: owner,
			repo: repo,
			title: prNum ? `Updating Visual Diff Goldens for PR ${prNum}` : `Updating Visual Diff Goldens for Branch ${sourceBranchName}`,
			head: `refs/heads/${goldensBranchName}`,
			base: `refs/heads/${sourceBranchName}`,
			draft: true,
			body: createPRBody()
		});
		goldenPrNum = newPR.data.number;
		console.log(`PR #${goldenPrNum} opened: ${newPR.data.html_url}`);
		await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
			owner: owner,
			repo: repo,
			issue_number: goldenPrNum,
			labels: [
				'auto-visual-diff'
			]
		});
		if (prNum) {
			await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
				owner: owner,
				repo: repo,
				issue_number: prNum,
				body: `Visual diff tests failed - pull request #${goldenPrNum} has been opened with the updated goldens.`
			});
		}
	} else {
		goldenPrNum = goldenPRs.data[0].number;
		console.log(`Goldens PR already exists: ${goldenPRs.data[0].html_url}`);
		console.log('Updating PR description');
		await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
			owner: owner,
			repo: repo,
			pull_number: goldenPrNum,
			body: createPRBody()
		});
	}

	console.log('Adding PR Reviewers');
	try {
		await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
			owner: owner,
			repo: repo,
			pull_number: goldenPrNum,
			reviewers: [
				actor
			]
		});
	} catch (e) {
		console.log('Could not add reviewer (expected for Dependabot PRs):');
		console.log(e);
	}
}

handlePR().catch((e) => {
	console.log(chalk.red(e));
	console.log(chalk.red('Could not open/update new goldens PR.'));
});
