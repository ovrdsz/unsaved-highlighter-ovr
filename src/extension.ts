import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "unsaved-lines-highlighter" está activa');

    const unsavedChangeDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        isWholeLine: true
    });

    let activeEditor = vscode.window.activeTextEditor;
    const modifiedLines = new Map<string, Set<number>>();

    function getDocumentKey(document: vscode.TextDocument): string {
        return document.uri.toString();
    }

    function clearModifiedLines(document: vscode.TextDocument) {
        const key = getDocumentKey(document);
        modifiedLines.delete(key);
    }

    function getOrCreateModifiedLines(document: vscode.TextDocument): Set<number> {
        const key = getDocumentKey(document);
        let lines = modifiedLines.get(key);
        if (!lines) {
            lines = new Set<number>();
            modifiedLines.set(key, lines);
        }
        return lines;
    }

    function handleNewLines(change: vscode.TextDocumentContentChangeEvent): number[] {
        const affectedLines: number[] = [];
        const startLine = change.range.start.line;
        const endLine = change.range.end.line;
        const newLineCount = change.text.split('\n').length - 1;
        
        for (let i = startLine; i <= endLine + newLineCount; i++) {
            affectedLines.push(i);
        }
        
        return affectedLines;
    }

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        const document = activeEditor.document;
        
        if (!document.isDirty) {
            activeEditor.setDecorations(unsavedChangeDecorationType, []);
            clearModifiedLines(document);
            return;
        }

        const lines = getOrCreateModifiedLines(document);
        const decorations: vscode.DecorationOptions[] = [];

        lines.forEach(lineNumber => {
            if (lineNumber < document.lineCount) {
                const range = document.lineAt(lineNumber).range;
                decorations.push({ range });
            }
        });

        activeEditor.setDecorations(unsavedChangeDecorationType, decorations);
    }

    let disposableEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            if (!editor.document.isDirty) {
                clearModifiedLines(editor.document);
            }
            updateDecorations();
        }
    });

    let disposableTextChange = vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            if (event.document.isDirty) {
                const lines = getOrCreateModifiedLines(event.document);
                
                event.contentChanges.forEach(change => {
                    const affectedLines = handleNewLines(change);
                    affectedLines.forEach(line => lines.add(line));
                });
            } else {
                clearModifiedLines(event.document);
            }
            
            updateDecorations();
        }
    });

    let disposableSave = vscode.workspace.onDidSaveTextDocument(document => {
        clearModifiedLines(document);
        if (activeEditor && document === activeEditor.document) {
            updateDecorations();
        }
    });

    let disposableClose = vscode.workspace.onDidCloseTextDocument(document => {
        clearModifiedLines(document);
    });

    context.subscriptions.push(
        disposableEditorChange,
        disposableTextChange,
        disposableSave,
        disposableClose,
        unsavedChangeDecorationType
    );
}

export function deactivate() {}