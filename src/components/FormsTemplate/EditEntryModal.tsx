import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Divider, Form as RsForm } from 'rsuite';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';

import { useUpdateFormEntryMutation } from '@/services/setup/formEntriesService';

const EditEntryModal = ({ open, setOpen, template, entry, onSaved }: any) => {
    const dispatch = useDispatch();
    const [updateEntry, updateMutation] = useUpdateFormEntryMutation();

    const [title, setTitle] = useState('');
    const [surveyModel, setSurveyModel] = useState<Model | null>(null);

    // ✅ build model whenever open + template + entry changes
    useEffect(() => {
        if (!open) return;

        setTitle(entry?.title ?? '');

        if (!template?.formJson) {
            setSurveyModel(null);
            return;
        }

        try {
            const formJson = JSON.parse(template.formJson);
            const answers = entry?.dataJson ? JSON.parse(entry.dataJson) : {};

            const s = new Model(formJson);
            s.data = answers;

            // ✅ keep answers updated while typing
            s.onValueChanged.add(() => {
                // no need setState every keystroke unless you want
            });

            s.showNavigationButtons = false;
            s.showCompletedPage = false;

            setSurveyModel(s);
        } catch (e) {
            setSurveyModel(null);
        }
    }, [open, template?.formJson, entry?.id]); // entry change rebuilds

    const handleSave = async () => {
        if (!entry?.id) return;

        if (!title.trim()) {
            dispatch(notify({ msg: 'Title is required', sev: 'warning' }));
            return;
        }
        if (!surveyModel) {
            dispatch(notify({ msg: 'Form is not ready', sev: 'warning' }));
            return;
        }

        const data = surveyModel.data ?? {};

        try {
            await updateEntry({
                id: entry.id,
                title: title.trim(),
                dataJson: JSON.stringify(data)
            }).unwrap();


            dispatch(notify({ msg: 'Updated successfully', sev: 'success' }));
            setOpen(false);
            onSaved?.();
        } catch (e) {
            dispatch(notify({ msg: 'Failed to update form', sev: 'error' }));
        }
    };

    const content = () => (
        <div style={{ padding: 12 }}>
            <RsForm fluid>
                <MyInput
                    width="28vw"
                    fieldLabel="Title"
                    fieldName="title"
                    record={{ title }}
                    setRecord={(r: any) => setTitle(r.title)}
                    required
                />
            </RsForm>

            <Divider />

            <div style={{ height: '70vh', overflow: 'auto', border: '1px solid #eef3f9', borderRadius: 14, padding: 12 }}>
                {!surveyModel ? <div>No form json found.</div> :
                    <div className="survey-scope">
                        <Survey model={surveyModel} />
                    </div>
                }
            </div>
        </div>
    );

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Edit Form"
            position="center"
            content={content}
            steps={[]}
            size="85vw"
            actionButtonLabel={updateMutation.isLoading ? 'Saving...' : 'Save'}
            actionButtonFunction={handleSave}
        />
    );
};

export default EditEntryModal;
