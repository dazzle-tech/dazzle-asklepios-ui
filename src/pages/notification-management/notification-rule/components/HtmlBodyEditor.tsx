import MyLabel from '@/components/MyLabel';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const EDITOR_TOOLBAR = {
  options: [
    'inline',
    'blockType',
    'fontSize',
    'fontFamily',
    'list',
    'textAlign',
    'link',
    'colorPicker',
    'history',
  ],
  inline: { inDropdown: true },
  list: { inDropdown: true },
  textAlign: { inDropdown: true },
  link: { inDropdown: true },
};

const normalizeHtmlForEditor = (html: string): string => {
  const trimmed = html.trim();
  if (!trimmed) return '';

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return `<p>${trimmed.replace(/\n/g, '</p><p>')}</p>`;
};

const htmlToEditorState = (html?: string | null): EditorState => {
  const incoming = html ?? '';
  if (!incoming.trim()) {
    return EditorState.createEmpty();
  }

  const normalized = normalizeHtmlForEditor(incoming);

  try {
    const { contentBlocks, entityMap } = htmlToDraft(normalized);
    if (contentBlocks?.length) {
      return EditorState.createWithContent(
        ContentState.createFromBlockArray(contentBlocks, entityMap)
      );
    }
  } catch {
    // fall through to plain text
  }

  return EditorState.createWithContent(ContentState.createFromText(incoming));
};

interface HtmlBodyEditorProps {
  label?: string;
  value?: string | null;
  onChange: (html: string) => void;
  required?: boolean;
  placeholder?: string;
  editorKey?: string | number;
}

const HtmlBodyEditor: React.FC<HtmlBodyEditorProps> = ({
  label = 'Body',
  value,
  onChange,
  required = false,
  placeholder,
  editorKey,
}) => {
  const [editorState, setEditorState] = useState(() => htmlToEditorState(value));
  const lastEmittedRef = useRef(value ?? '');
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const incoming = value ?? '';
    if (incoming === lastEmittedRef.current) return;

    isSyncingRef.current = true;
    lastEmittedRef.current = incoming;
    setEditorState(htmlToEditorState(incoming));

    queueMicrotask(() => {
      isSyncingRef.current = false;
    });
  }, [value, editorKey]);

  const handleEditorChange = (state: EditorState) => {
    setEditorState(state);

    if (isSyncingRef.current) return;

    const html = draftToHtml(convertToRaw(state.getCurrentContent()));
    if (html === lastEmittedRef.current) return;

    lastEmittedRef.current = html;
    onChange(html);
  };

  return (
    <div className="notification-html-body-editor">
      <MyLabel label={label} required={required} />
      <Editor
        key={editorKey}
        toolbar={EDITOR_TOOLBAR}
        editorState={editorState}
        onEditorStateChange={handleEditorChange}
        placeholder={placeholder ?? 'Write email body here...'}
        editorStyle={{
          minHeight: 220,
          width: '100%',
          border: '1px solid var(--rs-border-primary)',
          padding: '8px',
        }}
        editorClassName="notification-html-body-editor__content"
      />
    </div>
  );
};

export default HtmlBodyEditor;
