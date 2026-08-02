import MyLabel from '@/components/MyLabel';
import {
  CharacterMetadata,
  ContentBlock,
  ContentState,
  convertToRaw,
  EditorState,
} from 'draft-js';
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

const UNSUPPORTED_HTML_TAG_PATTERN =
  /<\/?(?:figure|script|style|noscript|iframe|object|embed)[^>]*>/gi;

const normalizeHtmlForEditor = (html: string): string => {
  const trimmed = html.trim();
  if (!trimmed) return '';

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return `<p>${trimmed.replace(/\n/g, '</p><p>')}</p>`;
};

const sanitizeHtmlForDraft = (html: string): string => {
  let sanitized = html
    .replace(UNSUPPORTED_HTML_TAG_PATTERN, '')
    .replace(/(<\/?)figure((?:\s+.*?)?>)/gi, '$1div$2')
    .trim();

  if (!sanitized) return '';

  if (!/^<(p|div|h[1-6]|ul|ol|blockquote|table)/i.test(sanitized)) {
    sanitized = `<div>${sanitized}</div>`;
  }

  return sanitized;
};

const sanitizeDraftConversion = (
  contentBlocks: ContentBlock[],
  entityMap: Record<string, unknown>
): { contentBlocks: ContentBlock[]; entityMap: Record<string, unknown> } => {
  const safeEntityMap = Object.fromEntries(
    Object.entries(entityMap ?? {}).filter(
      ([key, value]) => value != null && key != null && key !== 'null'
    )
  ) as Record<string, unknown>;

  const sanitizedBlocks = contentBlocks.map(block => {
    const blockType = block.getType();
    const blockEntityKey = block.getEntityAt(0);

    if (
      (blockType === 'atomic' || blockType === 'entity') &&
      (blockEntityKey == null || safeEntityMap[blockEntityKey] == null)
    ) {
      return block.merge({ type: 'unstyled' }) as ContentBlock;
    }

    const characterList = block.getCharacterList().map(charMeta => {
      const charEntityKey = charMeta.getEntity();
      if (charEntityKey != null && safeEntityMap[charEntityKey] == null) {
        return CharacterMetadata.applyEntity(charMeta, null);
      }
      return charMeta;
    });

    return block.set('characterList', characterList);
  });

  return { contentBlocks: sanitizedBlocks, entityMap: safeEntityMap };
};

const validateContentState = (contentState: ContentState): boolean => {
  try {
    contentState.getBlockMap().forEach(block => {
      const blockEntityKey = block.getEntityAt(0);
      if (blockEntityKey != null) {
        contentState.getEntity(blockEntityKey);
      }

      block.getCharacterList().forEach(charMeta => {
        const charEntityKey = charMeta.getEntity();
        if (charEntityKey != null) {
          contentState.getEntity(charEntityKey);
        }
      });
    });
    return true;
  } catch {
    return false;
  }
};

const createSafeContentState = (
  contentBlocks: ContentBlock[],
  entityMap: Record<string, unknown>
): ContentState | null => {
  try {
    const sanitized = sanitizeDraftConversion(contentBlocks, entityMap);
    const contentState = ContentState.createFromBlockArray(
      sanitized.contentBlocks,
      sanitized.entityMap
    );
    if (validateContentState(contentState)) {
      return contentState;
    }
  } catch {
    // try fallback below
  }

  try {
    const sanitized = sanitizeDraftConversion(contentBlocks, entityMap);
    const contentState = ContentState.createFromBlockArray(sanitized.contentBlocks);
    if (validateContentState(contentState)) {
      return contentState;
    }
  } catch {
    return null;
  }

  return null;
};

const htmlToEditorState = (html?: string | null): EditorState => {
  const incoming = html ?? '';
  if (!incoming.trim()) {
    return EditorState.createEmpty();
  }

  const normalized = sanitizeHtmlForDraft(normalizeHtmlForEditor(incoming));

  try {
    const { contentBlocks, entityMap } = htmlToDraft(normalized);
    if (contentBlocks?.length) {
      const contentState = createSafeContentState(contentBlocks, entityMap);
      if (contentState) {
        return EditorState.createWithContent(contentState);
      }
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
