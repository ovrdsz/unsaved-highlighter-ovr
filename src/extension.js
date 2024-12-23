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
// Esta función se llama cuando tu extensión se activa
function activate(context) {
    console.log('La extensión "unsaved-lines-highlighter" está activa');
    // Crear el decorador para las líneas no guardadas
    const unsavedLineDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)', // Fondo amarillo transparente
        isWholeLine: true,
    });
    // Mantener un registro de las líneas modificadas
    let modifiedLines = new Set();
    let activeEditor = vscode.window.activeTextEditor;
    // Función para actualizar las decoraciones
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }
        const decorations = [];
        modifiedLines.forEach(line => {
            const range = activeEditor.document.lineAt(line).range;
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
    context.subscriptions.push(disposableEditorChange, disposableTextChange, disposableSave, unsavedLineDecorationType);
}
// Esta función se llama cuando tu extensión se desactiva
function deactivate() { }
//# sourceMappingURL=extension.js.map