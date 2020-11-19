const chalk = require('chalk'),
	fs = require('fs');

const langs = ['ar', 'cy', 'da', 'de', 'es', 'es-es', 'fr', 'fr-fr', 'ja', 'ko', 'nl', 'pt', 'sv', 'tr', 'zh-tw', 'zh'];

function _parseFile(filePath) {
	const lang = import(filePath);
	return lang;
}

function _writeChanges(langTermsPath, fileName, content) {
	const json = JSON.stringify(content, null, '\t');
	const fileContent = `/* eslint quotes: 0 */
export default ${json};
`;
	fs.writeFileSync(`${langTermsPath}/${fileName}.js`, fileContent, 'utf8');
}

function prepare(langTermsPath) {
	const englishTranslations = _parseFile(`${langTermsPath}/en.js`);
	const englishKeys = Object.keys(englishTranslations);

	langs.forEach((lang) => {
		const filePath = `${langTermsPath}/${lang}.js`;

		if (!fs.existsSync(filePath)) return;
		
		let changes = false;
		const translations = _parseFile(filePath);
		englishKeys.forEach((key) => {
			const translatedValue = translations[key];
			if (translatedValue === undefined || translatedValue === '') {
				changes = true;
				translations[key] = englishTranslations[key];
			}
		});

		if (changes) {
			const ordered = {};
			Object.keys(translations).sort().forEach((key) => {
				ordered[key] = translations[key];
			});
			_writeChanges(langTermsPath, lang, ordered);
		}
	});
}

try {
	prepare(process.env['LANG_PATH']);
	process.exit(0);
} catch (err) {
	console.error(chalk.red(err));
	console.groupEnd();
	process.exit(1);
}
