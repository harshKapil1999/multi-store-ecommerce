'use client';

import { useEffect, useRef } from 'react';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Redo2, RemoveFormatting, Underline, Undo2 } from 'lucide-react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
};

export function RichTextEditor({ value, onChange, minHeight = 280 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const command = (name: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, argument);
    onChange(editorRef.current?.innerHTML || '');
  };

  const createLink = () => {
    const href = window.prompt('Enter the full link URL');
    if (href) command('createLink', href);
  };

  const controls = [
    { label: 'Bold', icon: Bold, commandName: 'bold' },
    { label: 'Italic', icon: Italic, commandName: 'italic' },
    { label: 'Underline', icon: Underline, commandName: 'underline' },
    { label: 'Bulleted list', icon: List, commandName: 'insertUnorderedList' },
    { label: 'Numbered list', icon: ListOrdered, commandName: 'insertOrderedList' },
    { label: 'Undo', icon: Undo2, commandName: 'undo' },
    { label: 'Redo', icon: Redo2, commandName: 'redo' },
    { label: 'Clear formatting', icon: RemoveFormatting, commandName: 'removeFormat' },
  ];

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
        <select
          aria-label="Text style"
          defaultValue="p"
          onChange={(event) => command('formatBlock', event.target.value)}
          className="h-8 rounded border bg-background px-2 text-sm"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        {controls.map(({ label, icon: Icon, commandName }) => (
          <button key={label} type="button" onClick={() => command(commandName)} title={label} aria-label={label} className="rounded p-2 hover:bg-accent">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button type="button" onClick={createLink} title="Link" aria-label="Link" className="rounded p-2 hover:bg-accent">
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="prose prose-sm max-w-none bg-background p-4 text-foreground outline-none dark:prose-invert"
        style={{ minHeight }}
      />
    </div>
  );
}
