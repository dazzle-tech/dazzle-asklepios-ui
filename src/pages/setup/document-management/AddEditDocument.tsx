import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import { GrDocumentText } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  type DocumentDefinitionDTO,
  type DocumentDefinitionResponseVM
} from '@/services/patients/documentManagementService';

const emptyForm = (): DocumentDefinitionDTO => ({
  code: '',
  name: '',
  description: '',
  category: undefined,
  status: undefined
});

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  document?: DocumentDefinitionResponseVM | null;
  onSaved: (action: 'create' | 'update', saved: DocumentDefinitionResponseVM) => void;
};

const AddEditDocument: React.FC<Props> = ({ open, setOpen, document, onSaved }) => {
  const dispatch = useAppDispatch();
  const isEdit = Boolean(document?.id);
  const [form, setForm] = useState<DocumentDefinitionDTO>(emptyForm());
  const [saving, setSaving] = useState(false);

  const categoryOptions = useEnumOptions('DocumentCategory');
  const statusOptions = useEnumOptions('DocumentStatus');

  const [createDocument] = useCreateDocumentMutation();
  const [updateDocument] = useUpdateDocumentMutation();

  useEffect(() => {
    if (!open) return;
    if (document?.id) {
      setForm({
        code: document.code ?? '',
        name: document.name ?? '',
        description: document.description ?? '',
        category: document.category,
        status: document.status
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, document]);

  const buildPayload = (): DocumentDefinitionDTO | null => {
    const code = form.code?.trim() ?? '';
    const name = form.name?.trim() ?? '';

    if (!code || !name) {
      dispatch(notify({ msg: 'Code and Name are required', sev: 'warning' }));
      return null;
    }

    return {
      code,
      name,
      ...(form.description?.trim() ? { description: form.description.trim() } : {}),
      ...(form.category ? { category: form.category } : {}),
      ...(form.status ? { status: form.status } : {})
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      setSaving(true);
      if (isEdit && document?.id) {
        const saved = await updateDocument({ id: document.id, body: payload }).unwrap();
        dispatch(notify({ msg: 'Document has been updated successfully', sev: 'success' }));
        setOpen(false);
        onSaved('update', saved);
      } else {
        const saved = await createDocument(payload).unwrap();
        dispatch(notify({ msg: 'Document has been added successfully', sev: 'success' }));
        setOpen(false);
        onSaved('create', saved);
      }
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Save Failed', sev: 'warning' }));
    } finally {
      setSaving(false);
    }
  };

  const content = () => (
    <Form fluid>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="code"
            fieldLabel="Code"
            record={form}
            setRecord={setForm}
            required
            disabled={isEdit}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="name"
            fieldLabel="Name"
            record={form}
            setRecord={setForm}
            required
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="category"
            fieldLabel="Category"
            fieldType="select"
            selectData={categoryOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={form}
            setRecord={setForm}
            searchable={false}
            placeholder="Select Category"
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="status"
            fieldLabel="Status"
            fieldType="select"
            selectData={statusOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={form}
            setRecord={setForm}
            searchable={false}
            placeholder="Select Status"
          />
        </Col>
      </Row>
      <MyInput
        width="100%"
        fieldName="description"
        fieldLabel="Description"
        fieldType="textarea"
        record={form}
        setRecord={setForm}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      position="right"
      title={isEdit ? 'Edit Document' : 'New Document'}
      content={content}
      steps={[{ title: 'Basic Info', icon: <GrDocumentText /> }]}
      size="40vw"
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      actionButtonLoading={saving}
      isDisabledActionBtn={saving}
    />
  );
};

export default AddEditDocument;
