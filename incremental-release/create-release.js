import { Octokit } from '@octokit/rest';

const release = `v${process.argv[2]}`;
const [owner, repo] = process.env['GITHUB_REPOSITORY'].split('/');

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN
});

async function createRelease() {

	console.log(`Creating release "${release}"...`)

	await octokit.rest.repos.createRelease({
		owner: owner,
		repo: repo,
		tag_name: release,
		name: release,
		generate_release_notes: true
	});
	console.log('Success!');

}

createRelease().then(() => {
	process.exit(0);
}).catch((err) => {
	console.error(err);
	process.exit(1);
});
