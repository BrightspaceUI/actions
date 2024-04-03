#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import { graphql } from '@octokit/graphql';
import { setOutput } from '@actions/core';

const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const approvalToken = process.env['APPROVAL_TOKEN'];
const autoMergeToken = process.env['AUTO_MERGE_TOKEN'];
const branchName = process.env['BRANCH_NAME'];
const defaultBranch = process.env['DEFAULT_BRANCH'];
const prTitle = process.env['PR_TITLE'];
const autoMergeMethod = process.env['AUTO_MERGE_METHOD'];
const tempDir = process.env['RUNNER_TEMP'];
const prDescriptionMaxSize = 65536;

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

const flattenDependencies = (dependencies, flattenedList, flattenedKey = '') => {
	const rootKey = flattenedKey;
	for (const [key, value] of Object.entries(dependencies)) {
		if (rootKey === '') {
			flattenedKey = key;
		} else {
			flattenedKey = `${rootKey} > ${key}`;
		}

		if (value?.version) {
			flattenedList.set(flattenedKey, value.version);
		}

		if (dependencies[key]?.dependencies) {
			flattenDependencies(dependencies[key].dependencies, flattenedList, flattenedKey);
		}
	}
};

const getDependencyDiff = () => {
	const beforeDependencies = loadPackageDependencies(`${tempDir}/dependencies-before.json`);
	const afterDependencies = loadPackageDependencies(`${tempDir}/dependencies-after.json`);

	const beforeFlattenedMap = new Map();
	const afterFlattenedMap = new Map();
	flattenDependencies(beforeDependencies, beforeFlattenedMap);
	flattenDependencies(afterDependencies, afterFlattenedMap);

	let hasDiff = false;
	let markDownTableDiff = `\n<details><summary>Dependency Changes</summary>\n\n|Package|Old Version|New Version|\n|---|---|---|`;

	for (const [key, value] of afterFlattenedMap.entries()) {
		let oldVersion = beforeFlattenedMap.get(key);
		const newVersion = value;
		let packageName = key;
		if (oldVersion !== newVersion) {
			hasDiff = true;
			if (!oldVersion) {
				oldVersion = 'N/A';
				packageName = `(NEW) ${packageName}`;
			}
			markDownTableDiff += `\n|${packageName}|${oldVersion}|${newVersion}|`;
		}
	}

	// check for removed dependencies
	for (const [key, value] of beforeFlattenedMap.entries()) {
		if (!afterFlattenedMap.has(key)) {
			hasDiff = true;
			const packageName = `(REMOVED) ${key}`;
			markDownTableDiff += `\n|${packageName}|${value}|N/A|`;
		}
	}

	if (hasDiff) {
		markDownTableDiff += `\n</details>`;
		return markDownTableDiff;
	}

	return '';
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
								id
								number
								createdAt
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

	let prBody = 'Automatic update of the \`package-lock.json\` file.';
	const prDependencyDiff = getDependencyDiff();

	if (prDependencyDiff !== '' && (prBody.length + prDependencyDiff.length) < prDescriptionMaxSize) {
		prBody += prDependencyDiff;
	}

	if (existingPr) {
		console.log(`PR for branch ${branchName} already exists: #${existingPr.node.number}.`);
		const threeDays = 1000 * 60 * 60 * 24 * 3;
		if (new Date() - new Date(existingPr.node.createdAt) > threeDays) {
			console.log('PR has been open for more than 3 days.');
			setOutput('stale', 'true');
			setOutput('pr-num', existingPr.node.number);
		}

		try {
			await graphqlForPR(
				`mutation updatePR($pullRequestId: ID!,  $body: String!) {
					updatePullRequest(input: {pullRequestId: $pullRequestId, body: $body}) {
						clientMutationId
					}
				}`,
				{
					pullRequestId: existingPr.node.id,
					body: prBody
				}
			);
			console.log(`PR ${existingPr.node.number} body updated on branch ${branchName}.`);
		} catch (e) {
			console.log(chalk.red('Failed to update the existing PR body.'));
			return Promise.reject(e.message);
		}

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
				body: prBody
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
