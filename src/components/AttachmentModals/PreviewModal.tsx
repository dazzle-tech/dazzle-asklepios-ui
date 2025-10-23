import React from 'react';
import { Modal } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';

interface PreviewModalProps {
    open: boolean;
    onClose: () => void;
    previewUrl: string;
    previewFileName: string;
    previewFileType: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
    open,
    onClose,
    previewUrl,
    previewFileName,
    previewFileType
}) => {
    return (
        <Modal 
            open={open} 
            onClose={onClose}
            size="lg"
            overflow={true}
        >
            <Modal.Header>
                <Modal.Title>{previewFileName}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '20px', minHeight: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {previewUrl && (
                    <>
                        {previewFileType?.startsWith('image/') ? (
                            <img 
                                src={previewUrl} 
                                alt={previewFileName}
                                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <p>Preview not available for this file type.</p>
                                <MyButton onClick={() => window.open(previewUrl, '_blank')}>
                                    Download
                                </MyButton>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <MyButton onClick={onClose} appearance="subtle">
                    Close
                </MyButton>
                <MyButton 
                    onClick={() => window.open(previewUrl, '_blank')}
                    appearance="primary"
                >
                    Download
                </MyButton>
            </Modal.Footer>
        </Modal>
    );
};

export default PreviewModal;
