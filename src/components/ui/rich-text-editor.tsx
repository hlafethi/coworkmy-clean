import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Définition des props pour l'éditeur
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

// Composant d'éditeur de texte riche simple
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  className,
  placeholder = "Commencez à écrire ici..."
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialiser l'éditeur avec la valeur initiale
  useEffect(() => {
    if (editorRef.current) {
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === "<br>") {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  // Gérer les changements dans l'éditeur
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Ajouter des fonctionnalités de formatage
  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-1 rounded hover:bg-muted"
          title="Gras"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-1 rounded hover:bg-muted"
          title="Italique"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="p-1 rounded hover:bg-muted"
          title="Souligné"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
            <line x1="4" y1="21" x2="20" y2="21"></line>
          </svg>
        </button>
        <span className="w-px h-6 bg-border mx-1"></span>
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-1 rounded hover:bg-muted"
          title="Liste à puces"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="p-1 rounded hover:bg-muted"
          title="Liste numérotée"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </button>
        <span className="w-px h-6 bg-border mx-1"></span>
        <button
          type="button"
          onClick={() => execCommand("createLink", prompt("URL du lien:", "https://") || "")}
          className="p-1 rounded hover:bg-muted"
          title="Insérer un lien"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertHTML", `<h2>${prompt("Texte du titre:", "") || ""}</h2>`)}
          className="p-1 rounded hover:bg-muted"
          title="Insérer un titre"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 12h12"></path>
            <path d="M6 20V4"></path>
            <path d="M18 20V4"></path>
          </svg>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[300px] outline-none overflow-auto"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || `<p class="text-muted-foreground">${placeholder}</p>`}}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
