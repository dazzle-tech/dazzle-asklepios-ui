
import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { Divider } from 'rsuite';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

const EntryPreviewModal = ({ open, setOpen, template, entry }: any) => {
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

    const content = () => (
        <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
                {entry?.title ?? ''} {template?.name ? `- ${template.name}` : ''}
            </div>
            <Divider />

            <div
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
            hideActionBtn
        />
    );
};

export default EntryPreviewModal;
