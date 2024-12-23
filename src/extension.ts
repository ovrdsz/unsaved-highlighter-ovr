import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "unsaved-lines-highlighter" está activa');

    const unsavedChangeDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        isWholeLine: false
    });

    let activeEditor = vscode.window.activeTextEditor;
    const modifiedRanges = new Map<string, vscode.Range[]>();

    function getDocumentKey(document: vscode.TextDocument): string {
        return document.uri.toString();
    }

    function clearModifiedRanges(document: vscode.TextDocument) {
        const key = getDocumentKey(document);
        modifiedRanges.delete(key);
    }

    function getOrCreateModifiedRanges(document: vscode.TextDocument): vscode.Range[] {
        const key = getDocumentKey(document);
        let ranges = modifiedRanges.get(key);
        if (!ranges) {
            ranges = [];
            modifiedRanges.set(key, ranges);
        }
        return ranges;
    }

    function mergeOverlappingRanges(ranges: vscode.Range[]): vscode.Range[] {
        if (ranges.length <= 1) return ranges;

        // Ordenar rangos por posición inicial
        const sortedRanges = ranges.sort((a, b) => {
            if (a.start.line !== b.start.line) {
                return a.start.line - b.start.line;
            }
            return a.start.character - b.start.character;
        });

        const mergedRanges: vscode.Range[] = [];
        let currentRange = sortedRanges[0];

        for (let i = 1; i < sortedRanges.length; i++) {
            const nextRange = sortedRanges[i];

            // Verificar si los rangos se solapan o son adyacentes
            if (currentRange.end.line > nextRange.start.line || 
                (currentRange.end.line === nextRange.start.line && 
                 currentRange.end.character >= nextRange.start.character - 1)) {
                // Combinar rangos
                currentRange = new vscode.Range(
                    currentRange.start,
                    nextRange.end.isAfter(currentRange.end) ? nextRange.end : currentRange.end
                );
            } else {
                mergedRanges.push(currentRange);
                currentRange = nextRange;
            }
        }

        mergedRanges.push(currentRange);
        return mergedRanges;
    }

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        const document = activeEditor.document;
        
        if (!document.isDirty) {
            activeEditor.setDecorations(unsavedChangeDecorationType, []);
            clearModifiedRanges(document);
            return;
        }

        const ranges = getOrCreateModifiedRanges(document);
        const mergedRanges = mergeOverlappingRanges(ranges);

        const decorations = mergedRanges.map(range => ({
            range: range
        }));

        activeEditor.setDecorations(unsavedChangeDecorationType, decorations);
    }

    let disposableEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            if (!editor.document.isDirty) {
                clearModifiedRanges(editor.document);
            }
            updateDecorations();
        }
    });

    let disposableTextChange = vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            if (event.document.isDirty) {
                const ranges = getOrCreateModifiedRanges(event.document);
                
                event.contentChanges.forEach(change => {
                    // Si es una inserción (rango vacío), crear un rango que cubra el texto insertado
                    if (change.rangeLength === 0 && change.text.length > 0) {
                        const endLine = change.range.start.line;
                        const endChar = change.range.start.character + change.text.length;
                        const endPosition = new vscode.Position(endLine, endChar);
                        ranges.push(new vscode.Range(change.range.start, endPosition));
                    } else {
                        // Para otros tipos de cambios, usar el rango proporcionado
                        ranges.push(change.range);
                    }
                });
            } else {
                clearModifiedRanges(event.document);
            }
            
            updateDecorations();
        }
    });

    let disposableSave = vscode.workspace.onDidSaveTextDocument(document => {
        clearModifiedRanges(document);
        if (activeEditor && document === activeEditor.document) {
            updateDecorations();
        }
    });

    let disposableClose = vscode.workspace.onDidCloseTextDocument(document => {
        clearModifiedRanges(document);
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