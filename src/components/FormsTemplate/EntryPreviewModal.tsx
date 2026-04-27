
import React, { useEffect, useMemo, useRef } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { Divider } from 'rsuite';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

const EntryPreviewModal = ({ open, setOpen, template, entry }: any) => {
    const printRef = useRef<HTMLDivElement | null>(null);
const survey = useMemo(() => {
    try {
        const rawFormJson =
            template?.formJson ??
            template?.json ??
            template?.schema ??
            template?.form ??
            null;

        if (!rawFormJson) {
            return null;
        }

        const formJson =
            typeof rawFormJson === 'string'
                ? JSON.parse(rawFormJson)
                : rawFormJson;

        const rawAnswers = entry?.dataJson;
        const answers =
            typeof rawAnswers === 'string'
                ? JSON.parse(rawAnswers)
                : rawAnswers || {};

        const s = new Model(formJson);
        s.data = answers;
        s.mode = 'display';
        s.showNavigationButtons = false;
        s.showCompletedPage = false;

        return s;
    } catch (e) {
        return null;
    }
}, [template, entry?.dataJson]);

    // ✅ add print css once
    useEffect(() => {
        const styleId = 'print-area-style';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        .print-area, .print-area * { visibility: visible !important; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; }
      }
    `;
        document.head.appendChild(style);
    }, []);

    const handlePrint = () => {
        // ensure element exists and survey rendered
        if (!printRef.current) return;
        setTimeout(() => window.print(), 150);
    };

    const content = () => (
        <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
                {entry?.title ?? ''} {template?.name ? `- ${template.name}` : ''}
            </div>
            <Divider />

            {/* ✅ This is the printable area */}
            <div
                ref={printRef}
                className="print-area"
                style={{
                    height: '70vh',
                    overflow: 'auto',
                    border: '1px solid #eef3f9',
                    borderRadius: 14,
                    padding: 12
                }}
            >
                {!survey ? <div>No preview available.</div> :
                    <div className="survey-scope">
                        <Survey model={survey} />
                    </div>
                }
            </div>
        </div>
    );

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Preview"
            position="center"
            content={content}
            steps={[]}
            size="85vw"
            actionButtonLabel="Print"
            actionButtonFunction={handlePrint}
        />
    );
};

export default EntryPreviewModal;
