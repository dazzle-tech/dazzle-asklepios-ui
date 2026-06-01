import React, { useEffect, useMemo, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form as RsForm, Divider } from 'rsuite';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';

import { useGetFormTemplateQuery } from '@/services/setup/formTemplateService';
import { useCreateFormEntryMutation } from '@/services/setup/formEntriesService';

type UseTemplateModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  templateRow: any;
  patientId?: number | null;
  encounterId?: number | null;
  onSaved?: (savedEntry: any) => void | Promise<void>;
};

const UseTemplateModal = ({
  open,
  setOpen,
  templateRow,
  patientId = null,
  encounterId = null,
  onSaved
}: UseTemplateModalProps) => {
    const dispatch = useDispatch();
    const templateId = templateRow?.id;

    const { data: tpl, isFetching } = useGetFormTemplateQuery(templateId, { skip: !templateId });
    const [createEntry, createEntryMutation] = useCreateFormEntryMutation();

    const [entryTitle, setEntryTitle] = useState('');
    const [completedData, setCompletedData] = useState<any | null>(null);

    // reset when open changes
    useEffect(() => {
        if (open) {
            setEntryTitle('');
            setCompletedData(null);
        }
    }, [open]);

    const survey = useMemo(() => {
        if (!tpl?.formJson) return null;
        const json = JSON.parse(tpl.formJson);
        const s = new Model(json);
        s.onComplete.add((sender) => {
            setCompletedData(sender.data);
        });
        return s;
    }, [tpl?.formJson]);

 const handleSave = async () => {
    if (!templateRow?.id) return;

    const data = completedData ?? survey?.data;

    if (!entryTitle?.trim()) {
        dispatch(notify({ msg: 'Title is required', sev: 'warning' }));
        return;
    }

    if (!data || Object.keys(data).length === 0) {
        dispatch(notify({ msg: 'Please fill the form before saving', sev: 'warning' }));
        return;
    }

    const facilityId = templateRow.facilityId != null ? Number(templateRow.facilityId) : null;
    const departmentId =
      templateRow.departmentId != null ? Number(templateRow.departmentId) : null;

    if (!facilityId || Number.isNaN(facilityId)) {
      dispatch(
        notify({
          msg: 'Template facility is missing. Please re-select the form template.',
          sev: 'warning'
        })
      );
      return;
    }

    if (!departmentId || Number.isNaN(departmentId)) {
      dispatch(
        notify({
          msg: 'Template department is missing. Please re-select the form template.',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const saved = await createEntry({
        title: entryTitle.trim(),
        templateId: Number(templateRow.id),
        facilityId,
        departmentId,
        dataJson: JSON.stringify(data),
        patientId: patientId ?? null,
        encounterId: encounterId ?? null
      }).unwrap();

      await onSaved?.(saved);

      dispatch(notify({ msg: 'Form saved successfully', sev: 'success' }));
      setOpen(false);
    } catch (e: any) {
      const serverMsg =
        e?.data?.message ||
        e?.data?.detail ||
        e?.data?.title ||
        (Array.isArray(e?.data?.fieldErrors) && e.data.fieldErrors[0]?.message);

      dispatch(
        notify({
          msg: serverMsg || 'Failed to save form',
          sev: 'error'
        })
      );
    }
};

    const content = () => (
        <div style={{ padding: 12 }}>
            <RsForm fluid>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <MyInput
                        width="28vw"
                        fieldLabel="Title"
                        fieldName="title"
                        record={{ title: entryTitle }}
                        setRecord={(r: any) => setEntryTitle(r.title)}
                        required
                    />
                </div>
            </RsForm>

            <Divider />

            <div style={{ height: '70vh', overflow: 'auto', border: '1px solid #eef3f9', borderRadius: 14, padding: 10 }}>
                {isFetching ? (
                    <div>Loading form…</div>
                ) : !survey ? (
                    <div>No form json found.</div>
                ) : (
                    <div className="survey-scope">
                        <Survey model={survey} />
                    </div>

                )}
            </div>
        </div>
    );

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={`Use Template: ${templateRow?.name ?? ''}`}
            position="center"
            content={content}
            actionButtonLabel={createEntryMutation.isLoading ? 'Saving...' : 'Save'}
            actionButtonFunction={handleSave}
            steps={[]}
            size="80vw"
        />
    );
};

export default UseTemplateModal;
