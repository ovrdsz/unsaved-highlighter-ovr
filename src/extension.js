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
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        isWholeLine: true,
    });
    let modifiedLines = new Map();
    let activeEditor = vscode.window.activeTextEditor;
    let documentVersions = new Map();
    function getDocumentKey(document) {
        return document.uri.toString();
    }
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }
        const document = activeEditor.document;
        const documentKey = getDocumentKey(document);
        const lines = modifiedLines.get(documentKey) || new Set();
        const decorations = [];
        lines.forEach(line => {
            if (line < document.lineCount) {
                const lineText = document.lineAt(line);
                const range = lineText.range;
                decorations.push({ range });
            }
        });
        activeEditor.setDecorations(unsavedLineDecorationType, decorations);
    }
    function clearModifiedLines(document) {
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
                lines = new Set();
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
                    }
                    else {
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
    context.subscriptions.push(disposableEditorChange, disposableTextChange, disposableSave, disposableClose, unsavedLineDecorationType);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map