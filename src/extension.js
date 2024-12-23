"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('La extensión "unsaved-lines-highlighter" está activa');
    const unsavedLineDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(9, 255, 0, 0.2)',
        isWholeLine: true,
    });
    let activeEditor = vscode.window.activeTextEditor;
    const modifiedLines = new Map();
    function getDocumentKey(document) {
        return document.uri.toString();
    }
    function clearModifiedLines(document) {
        const key = getDocumentKey(document);
        modifiedLines.delete(key);
    }
    function getOrCreateModifiedLines(document) {
        const key = getDocumentKey(document);
        let lines = modifiedLines.get(key);
        if (!lines) {
            lines = new Set();
            modifiedLines.set(key, lines);
        }
        return lines;
    }
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }
        const document = activeEditor.document;
        // Si el documento no está modificado, no mostrar decoraciones
        if (!document.isDirty) {
            activeEditor.setDecorations(unsavedLineDecorationType, []);
            clearModifiedLines(document);
            return;
        }
        const lines = getOrCreateModifiedLines(document);
        const decorations = [];
        lines.forEach(lineNumber => {
            if (lineNumber < document.lineCount) {
                const range = document.lineAt(lineNumber).range;
                decorations.push({ range });
            }
        });
        activeEditor.setDecorations(unsavedLineDecorationType, decorations);
    }
    let disposableEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            // Si el documento no está modificado, limpiar las líneas
            if (!editor.document.isDirty) {
                clearModifiedLines(editor.document);
            }
            updateDecorations();
        }
    });
    let disposableTextChange = vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            // Solo procesar si el documento está realmente modificado
            if (event.document.isDirty) {
                const lines = getOrCreateModifiedLines(event.document);
                event.contentChanges.forEach(change => {
                    for (let line = change.range.start.line; line <= change.range.end.line; line++) {
                        lines.add(line);
                    }
                });
            }
            else {
                // Si el documento no está modificado (por ejemplo, después de un undo completo)
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
    // Manejar cuando un documento se cierra
    let disposableClose = vscode.workspace.onDidCloseTextDocument(document => {
        clearModifiedLines(document);
    });
    context.subscriptions.push(disposableEditorChange, disposableTextChange, disposableSave, disposableClose, unsavedLineDecorationType);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map