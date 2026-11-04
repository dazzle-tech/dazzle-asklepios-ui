import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  url?: string;
  fileName?: string;
  mimeType?: string;
};

const isImageFile = (mimeType?: string, fileName?: string) => {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  return mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
};

const isPdfFile = (mimeType?: string, fileName?: string) => {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  return mime.includes('pdf') || name.endsWith('.pdf');
};

const isOfficeFile = (mimeType?: string, fileName?: string) => {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  return (
    mime.includes('word') ||
    mime.includes('excel') ||
    mime.includes('powerpoint') ||
    mime.includes('officedocument') ||
    mime.includes('msword') ||
    mime.includes('spreadsheet') ||
    /\.(docx?|xlsx?|pptx?)$/.test(name)
  );
};

const DocumentTemplatePreviewModal: React.FC<Props> = ({
  open,
  setOpen,
  url,
  fileName,
  mimeType
}) => {
  const content = () => {
    if (!url) {
      return <div>No preview available.</div>;
    }

    if (isImageFile(mimeType, fileName)) {
      return (
        <div className="document-template-preview-frame">
          <img src={url} alt={fileName || 'Document'} className="document-template-preview-image" />
        </div>
      );
    }

    if (isPdfFile(mimeType, fileName)) {
      return (
        <div className="document-template-preview-frame">
          <iframe
            title={fileName || 'Document preview'}
            src={url}
            className="document-template-preview-iframe"
          />
        </div>
      );
    }

    if (isOfficeFile(mimeType, fileName)) {
      return (
        <div className="document-template-preview-frame">
          <iframe
            title={fileName || 'Document preview'}
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            className="document-template-preview-iframe"
          />
        </div>
      );
    }

    return (
      <div className="document-template-preview-fallback">
        <p>
          <Translate>Preview is not available for this file type.</Translate>
        </p>
        <MyButton onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
          Download
        </MyButton>
      </div>
    );
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={fileName || 'Preview'}
      position="center"
      content={content}
      steps={[]}
      size="85vw"
      bodyheight="75vh"
      hideActionBtn
      hideBack
      enforceFocus={false}
    />
  );
};

export default DocumentTemplatePreviewModal;
