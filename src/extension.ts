import * as vscode from 'vscode';

// Esta función se llama cuando tu extensión se activa
export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "unsaved-lines-highlighter" está activa');

    // Crear el decorador para las líneas no guardadas
    const unsavedLineDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)', // Fondo amarillo transparente
        isWholeLine: true,
    });

    // Mantener un registro de las líneas modificadas
    let modifiedLines = new Set<number>();
    let activeEditor = vscode.window.activeTextEditor;

    // Función para actualizar las decoraciones
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        modifiedLines.forEach(line => {
            const range = activeEditor!.document.lineAt(line).range;
            decorations.push({ range });
        });

        activeEditor.setDecorations(unsavedLineDecorationType, decorations);
    }

    // Registrar el evento para cambios en el editor activo
    let disposableEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            modifiedLines.clear();
            updateDecorations();
        }
    });

    // Registrar el evento para cambios en el texto
    let disposableTextChange = vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            event.contentChanges.forEach(change => {
                const startLine = change.range.start.line;
                modifiedLines.add(startLine);
            });
            updateDecorations();
        }
    });

    // Registrar el evento para cuando se guarda el documento
    let disposableSave = vscode.workspace.onDidSaveTextDocument(document => {
        if (activeEditor && document === activeEditor.document) {
            modifiedLines.clear();
            updateDecorations();
        }
    });

    // Añadir a las suscripciones para limpiar correctamente
    context.subscriptions.push(
        disposableEditorChange,
        disposableTextChange,
        disposableSave,
        unsavedLineDecorationType
    );
}

// Esta función se llama cuando tu extensión se desactiva
export function deactivate() {}