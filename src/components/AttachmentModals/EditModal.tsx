import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useUpdateAttachmentMutation } from '@/services/patients/attachmentService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { PatientAttachment } from '@/types/model-types-new';
import { ApLovValues } from '@/types/model-types';

interface EditModalProps {
    open: boolean;
    onClose: () => void;
    selectedAttachment: PatientAttachment | null;
    patientId: number;
    attachmentTypesLov: ApLovValues[];
    onUpdateSuccess: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
    open,
    onClose,
    selectedAttachment,
    patientId,
    attachmentTypesLov,
    onUpdateSuccess
}) => {
    const dispatch = useAppDispatch();
    const [updateAttachment, { isLoading: isUpdating }] = useUpdateAttachmentMutation();
    const [editFormData, setEditFormData] = useState<{ type: string; details: string }>({ 
        type: '', 
        details: '' 
    });

    // Update form data when selectedAttachment changes
    useEffect(() => {
        if (selectedAttachment && open) {
            setEditFormData({
                type: selectedAttachment.type || '',
                details: selectedAttachment.details || ''
            });
        }
    }, [selectedAttachment, open]);

    // Handle Save Edit
    const handleSaveEdit = async () => {
        if (!selectedAttachment?.id) return;

        try {
            await updateAttachment({
                id: selectedAttachment.id,
                patientId: patientId,
                type: editFormData.type || undefined,
                details: editFormData.details || undefined
            }).unwrap();

            dispatch(notify({ msg: 'Attachment Updated Successfully', sev: 'success' }));
            onUpdateSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Update error:', error);
            dispatch(notify({ 
                msg: error?.data?.message || 'Failed to Update Attachment', 
                sev: 'error' 
            }));
        }
    };

    // Handle Close
    const handleClose = () => {
        setEditFormData({ type: '', details: '' });
        onClose();
    };

    return (
        <Modal 
            open={open} 
            onClose={handleClose}
            size="sm"
        >
            <Modal.Header>
                <Modal.Title>Edit Attachment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form fluid>
                    <MyInput
                        width={450}
                        fieldName="type"
                        fieldType="select"
                        selectData={attachmentTypesLov}
                        selectDataLabel="lovDisplayVale"
                        fieldLabel="Type"
                        selectDataValue="key"
                        record={editFormData}
                        setRecord={setEditFormData}
                        searchable={true}
                    />
                    <MyInput
                        width={450}
                        record={editFormData}
                        setRecord={setEditFormData}
                        fieldType="textarea"
                        fieldName="details"
                        placeholder="Details"
                        fieldLabel="Details"
                    />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <MyButton onClick={handleClose} appearance="subtle">
                    Cancel
                </MyButton>
                <MyButton 
                    onClick={handleSaveEdit}
                    appearance="primary"
                    disabled={isUpdating}
                >
                    {isUpdating ? 'Saving...' : 'Save'}
                </MyButton>
            </Modal.Footer>
        </Modal>
    );
};

export default EditModal;
