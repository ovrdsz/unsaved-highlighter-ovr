import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "unsaved-lines-highlighter" está activa');

    const unsavedLineDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        isWholeLine: true,
    });

    let modifiedLines = new Map<string, Set<number>>();
    let activeEditor = vscode.window.activeTextEditor;
    let documentVersions = new Map<string, number>();

    function getDocumentKey(document: vscode.TextDocument): string {
        return document.uri.toString();
    }

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        const document = activeEditor.document;
        const documentKey = getDocumentKey(document);
        const lines = modifiedLines.get(documentKey) || new Set<number>();
        
        const decorations: vscode.DecorationOptions[] = [];
        lines.forEach(line => {
            if (line < document.lineCount) {
                const lineText = document.lineAt(line);
                const range = lineText.range;
                decorations.push({ range });
            }
        });

        activeEditor.setDecorations(unsavedLineDecorationType, decorations);
    }

    function clearModifiedLines(document: vscode.TextDocument) {
        const documentKey = getDocumentKey(document);
        modifiedLines.delete(documentKey);
        documentVersions.delete(documentKey);
        updateDecorations();
    }

    let disposableEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            updateDecorations();
        }
    });

    let disposableTextChange = vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            const documentKey = getDocumentKey(event.document);
            let lines = modifiedLines.get(documentKey);
            
            if (!lines) {
                lines = new Set<number>();
                modifiedLines.set(documentKey, lines);
            }

            const currentVersion = event.document.version;
            const previousVersion = documentVersions.get(documentKey) || currentVersion;
            const isUndo = currentVersion < previousVersion;

            event.contentChanges.forEach(change => {
                const startLine = change.range.start.line;
                const endLine = change.range.end.line;
                
                for (let line = startLine; line <= endLine; line++) {
                    if (isUndo) {
                        const lineText = event.document.lineAt(line).text;
                        const isDifferent = event.document.isDirty && 
                                          lineText !== event.document.lineAt(line).text;
                        
                        if (!isDifferent) {
                            lines.delete(line);
                        }
                    } else {
                        lines.add(line);
                    }
                }
            });

            documentVersions.set(documentKey, currentVersion);
            updateDecorations();
        }
    });

    let disposableSave = vscode.workspace.onDidSaveTextDocument(document => {
        clearModifiedLines(document);
    });

    let disposableClose = vscode.workspace.onDidCloseTextDocument(document => {
        clearModifiedLines(document);
    });

    context.subscriptions.push(
        disposableEditorChange,
        disposableTextChange,
        disposableSave,
        disposableClose,
        unsavedLineDecorationType
    );
}

export function deactivate() {}