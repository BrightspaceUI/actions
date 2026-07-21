/**
 * Creates a GitHub prerelease without changing semantic-release's normal
 * branch/version semantics.
 */
export async function publish(_pluginConfig, context) {
	const token = context.env.GITHUB_TOKEN;
	const repository = context.env.GITHUB_REPOSITORY;
	const apiUrl = context.env.GITHUB_API_URL || 'https://api.github.com';

	if (!token) {
		throw new Error('GITHUB_TOKEN is required to create a GitHub prerelease.');
	}

	if (!repository) {
		throw new Error('GITHUB_REPOSITORY is required to create a GitHub prerelease.');
	}

	const [owner, repo] = repository.split('/');

	if (!owner || !repo) {
		throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`);
	}

	const response = await fetch(`${apiUrl}/repos/${owner}/${repo}/releases`, {
		method: 'POST',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
		body: JSON.stringify({
			tag_name: context.nextRelease.gitTag,
			target_commitish: context.nextRelease.gitHead,
			name: context.nextRelease.name,
			body: context.nextRelease.notes,
			prerelease: true,
			make_latest: 'false',
		}),
	});

	if (!response.ok) {
		throw new Error(
			`Unable to create GitHub prerelease: ${response.status} ${await response.text()}`
		);
	}

	const release = await response.json();

	context.logger.log('Published GitHub prerelease: %s', release.html_url);

	return {
		name: 'GitHub prerelease',
		url: release.html_url,
		id: release.id,
	};
}