#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import { graphql } from '@octokit/graphql';

const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const approvalToken = process.env['APPROVAL_TOKEN'];
const autoMergeToken = process.env['AUTO_MERGE_TOKEN'];
const branchName = process.env['BRANCH_NAME'];
const defaultBranch = process.env['DEFAULT_BRANCH'];
const prTitle = process.env['PR_TITLE'];
const autoMergeMethod = process.env['AUTO_MERGE_METHOD'];
const tempDir = process.env['TEMP_DIR'];

const graphqlForPR = graphql.defaults({
	headers: {
		authorization: `token ${process.env['GITHUB_TOKEN']}`,
	}
});

const loadPackageDependencies = (filePath) => {
	let dependencies;

	try {
		const fileContents = fs.readFileSync(filePath, 'utf8');
		const packages = JSON.parse(fileContents);
		dependencies = packages?.dependencies ? packages.dependencies : {};
	} catch {
		return {};
   }

   return dependencies;
};

const getDependencyDiff = () => {
	const beforeDependencies = loadPackageDependencies(`${tempDir}/dependencies-before.json`);
	const afterDependencies = loadPackageDependencies(`${tempDir}/dependencies-after.json`);
	let hasDiff = false;
	let markDownTableDiff = `| Package | Old Version | New Version |
| --- | --- | --- |`;

	for (const [key, value] of Object.entries(afterDependencies)) {
		const oldVersion = beforeDependencies[key]?.version;
		const newVersion = value?.version;
		if (oldVersion !== newVersion) {
			hasDiff = true;
			markDownTableDiff+=`
| ${key} | ${oldVersion} | ${newVersion} |`;
		}
	}

	return hasDiff ? markDownTableDiff : '';
};

async function handlePR() {
	const existingPrResponse = await graphqlForPR(
		`query existingPR($owner: String!, $repo: String!, $head: String!, $base: String!) {
			repository(owner: $owner, name: $repo) {
				id
				ref(qualifiedName: $head) {
					associatedPullRequests(baseRefName: $base, first: 1, states: OPEN) {
						edges {
							node {
								number
							}
						}
					}
			  	}
			}
		}`,
		{
			owner: owner,
			repo: repo,
			head: branchName,
			base: defaultBranch
		}
	);

	const repositoryId = existingPrResponse.repository.id;
	const existingPr = existingPrResponse.repository.ref.associatedPullRequests.edges[0];
	const mergeMethod = autoMergeMethod.toUpperCase()
	
	if (!['MERGE', 'SQUASH', 'REBASE'].includes(mergeMethod)) {
		console.log(chalk.red('Must use supported merge method, can be `merge`, `squash` or `rebase`'));
		process.exit(1);
	}

	if (existingPr) {
		console.log(`PR for branch ${branchName} already exists: #${existingPr.node.number}`);
		process.exit(0);
	}

	let newPrId;
	try {
		const createPrResponse = await graphqlForPR(
			`mutation createPR($repositoryId: ID!, $head: String!, $base: String!, $title: String!, $body: String!) {
				createPullRequest(input: {repositoryId: $repositoryId, headRefName: $head, baseRefName: $base, title: $title, body: $body}) {
					pullRequest {
						id
						number
					}
				}
			}`,
			{
				repositoryId: repositoryId,
				head: branchName,
				base: defaultBranch,
				title: prTitle,
				body: `Automatic update of the \`package-lock.json\` file.
${getDependencyDiff()}`
			}
		);
		newPrId = createPrResponse.createPullRequest.pullRequest.id;
		console.log(`PR for branch ${branchName} created: #${createPrResponse.createPullRequest.pullRequest.number}`);
	} catch (e) {
		console.log(chalk.red('Failed to open new PR'));
		return Promise.reject(e.message);
	}

	if (autoMergeToken) {
		const graphqlForAutoMerge = graphql.defaults({
			headers: {
				authorization: `token ${autoMergeToken}`,
			}
		});

		try {
			await graphqlForAutoMerge(
				`mutation enableAutoMerge($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
					enablePullRequestAutoMerge(input: {
						pullRequestId: $pullRequestId,
						mergeMethod: $mergeMethod
					}) {
						clientMutationId
					}
				}`,
				{
					pullRequestId: newPrId,
					mergeMethod: mergeMethod
				}
			);
			console.log('PR set to auto-merge');
		} catch (e) {
			console.log(chalk.red('Failed to set auto-merge on for the new PR'));
			return Promise.reject(e.message);
		}
	}

	if (approvalToken) {
		const graphqlForApproval = graphql.defaults({
			headers: {
				authorization: `token ${approvalToken}`,
			}
		});

		try {
			await graphqlForApproval(
				`mutation approvePR($pullRequestId: ID!) {
					addPullRequestReview(input: {pullRequestId: $pullRequestId}) {
						clientMutationId
					}
					submitPullRequestReview(input: {event: APPROVE, pullRequestId: $pullRequestId}) {
						clientMutationId
					}
				}`,
				{
					pullRequestId: newPrId
				}
			);
			console.log('PR auto-approved');
		} catch (e) {
			console.log(chalk.red('Failed to auto-approve the new PR'));
			return Promise.reject(e.message);
		}
	}
}

handlePR().catch((e) => {
	console.log(chalk.red(e));
	process.exit(1);
});
