import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "unsaved-lines-highlighter" está activa');

    const unsavedLineDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        isWholeLine: true,
    });

    let modifiedLines = new Set<number>();
    let activeEditor = vscode.window.activeTextEditor;
    let originalContent: string | undefined;

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        const currentContent = activeEditor.document.getText();
        
        if (originalContent) {
            const originalLines = originalContent.split('\n');
            const currentLines = currentContent.split('\n');
            
            modifiedLines.forEach(lineNumber => {
                if (lineNumber < originalLines.length && 
                    lineNumber < currentLines.length && 
                    originalLines[lineNumber] !== currentLines[lineNumber]) {
                    const range = activeEditor!.document.lineAt(lineNumber).range;
                    decorations.push({ range });
                } else {
                    modifiedLines.delete(lineNumber);
                }
            });
        }

        activeEditor.setDecorations(unsavedLineDecorationType, decorations);
    }

    function saveOriginalContent(editor: vscode.TextEditor | undefined) {
        if (editor) {
            originalContent = editor.document.getText();
            modifiedLines.clear();
        }
    }

    let disposableEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        saveOriginalContent(editor);
        updateDecorations();
    });

    let disposableTextChange = vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            if (!originalContent) {
                originalContent = activeEditor.document.getText();
            }
            
            event.contentChanges.forEach(change => {
                const startLine = change.range.start.line;
                modifiedLines.add(startLine);
            });
            
            updateDecorations();
        }
    });

    let disposableSave = vscode.workspace.onDidSaveTextDocument(document => {
        if (activeEditor && document === activeEditor.document) {
            saveOriginalContent(activeEditor);
            updateDecorations();
        }
    });

    if (activeEditor) {
        saveOriginalContent(activeEditor);
    }

    context.subscriptions.push(
        disposableEditorChange,
        disposableTextChange,
        disposableSave,
        unsavedLineDecorationType
    );
}

export function deactivate() {}