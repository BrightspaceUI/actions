#!/usr/bin/env node

import chalk from 'chalk';
import { graphql } from '@octokit/graphql';

const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');
const approvalToken = process.env['APPROVAL_TOKEN'];
const autoMergeToken = process.env['AUTO_MERGE_TOKEN'];
const branchName = process.env['BRANCH_NAME'];
const defaultBranch = process.env['DEFAULT_BRANCH'];
const prTitle = process.env['PR_TITLE'];

const graphqlForPR = graphql.defaults({
	headers: {
		authorization: `token ${process.env['GITHUB_TOKEN']}`,
	}
});

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
				body: 'Automatic update of the `package-lock.json` file.'
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
				`mutation enableAutoMerge($pullRequestId: ID!) {
					enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId }) {
						clientMutationId
					}
				}`,
				{
					pullRequestId: newPrId
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
