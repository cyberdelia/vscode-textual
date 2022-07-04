import { ExtensionContext, languages, commands, window, workspace, TextDocument, DiagnosticCollection, DiagnosticSeverity, Range, Diagnostic } from 'vscode';

const readability = require('text-readability')

// No multi-line alas.
const regex = new RegExp(/(#|\/\/|\/\*)(.+)/g)

export function activate(context: ExtensionContext) {
	const collection = languages.createDiagnosticCollection('comments');
	if (window.activeTextEditor) {
		refreshDiagnostics(window.activeTextEditor.document, collection);
	}
	context.subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			refreshDiagnostics(editor.document, collection);
		}
	}));
	context.subscriptions.push(
		workspace.onDidChangeTextDocument(editor => refreshDiagnostics(editor.document, collection))
	);

	commands.registerCommand("textual.enableTextual", () => {
		workspace.getConfiguration("textual").update("enableTextual", true, true);
	});

	commands.registerCommand("textual.disableTextual", () => {
		workspace.getConfiguration("textual").update("enableTextual", false, true);
	});
}

function refreshDiagnostics(document: TextDocument, collection: DiagnosticCollection) {
	collection.clear();

	let diagnostics = [];
	let match;
	const text = document.getText();
	while (match = regex.exec(text)) {
		const startPos = document.positionAt(match.index);
		const endPos = document.positionAt(match.index + match[0].length);
		const range = new Range(startPos, endPos);
		const score = readability.textStandard(match[0], true);
		if (range && score >= 7.0) {
			diagnostics.push(new Diagnostic(range, 'This comment could be clearer.', DiagnosticSeverity.Hint));
		}
	}
	collection.set(document.uri, diagnostics);
}