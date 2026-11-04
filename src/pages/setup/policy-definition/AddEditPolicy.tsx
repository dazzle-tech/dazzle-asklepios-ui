import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { GrTestDesktop } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
    useCreatePolicyDefinitionMutation,
    useUpdatePolicyDefinitionMutation
} from '@/services/setup/policyDefinition/policyDefinitionService';
import {
    PolicyDefinitionCreateDTO,
    PolicyDefinitionUpdateDTO
} from '@/types/model-types-new';
import {
    newPolicyDefinitionCreateDTO,
    newPolicyDefinitionUpdateDTO
} from '@/types/model-types-constructor-new';

const AddEditPolicy = ({ open, setOpen, policy, setPolicy, onSaved }) => {
    const dispatch = useAppDispatch();
    const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});

    const [policyCreateDTO, setPolicyCreateDTO] = useState<PolicyDefinitionCreateDTO>({
        ...newPolicyDefinitionCreateDTO
    });
    const [policyUpdateDTO, setPolicyUpdateDTO] = useState<PolicyDefinitionUpdateDTO>({
        ...newPolicyDefinitionUpdateDTO
    });

    const [createPolicy] = useCreatePolicyDefinitionMutation();
    const [updatePolicy] = useUpdatePolicyDefinitionMutation();

    useEffect(() => {
        if (policy?.id) {
            setPolicyUpdateDTO({
                id: policy.id,
                facilityId: policy.facilityId,
                code: policy.code,
                name: policy.name,
                description: policy.description,
            });
        } else {
            setPolicyCreateDTO({
                ...newPolicyDefinitionCreateDTO
            });
        }
    }, [policy]);

    // extract the error message from the bad request that coming from the backend
    const extractErrorMessage = (response: any): string => {
        try {
            const msg = response?.data?.message;
            if (typeof msg === 'string') {
                return msg.replace(/^error\./i, '');
            }
            return '';
        } catch {
            return '';
        }
    };

    const handleSave = () => {
        if (!policy?.id) {
            let errorMsg = "";
            if (!policyCreateDTO.facilityId) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Facility is required"
                else
                    errorMsg = errorMsg + ", Facility is required"
            }
            if (!policyCreateDTO.name) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Name is required"
                else
                    errorMsg = errorMsg + ", Name is required"
            }
            if (
                !policyCreateDTO.code
            ) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Code is required";
                else
                    errorMsg = errorMsg + ", Code is required";
            }
            if (errorMsg) {
                dispatch(notify({ msg: errorMsg, sev: 'warning' }));
                return;
            }
            createPolicy(policyCreateDTO)
                .unwrap()
                .then(() => {
                    setOpen(false);
                    setPolicyCreateDTO({ ...newPolicyDefinitionCreateDTO });
                    dispatch(notify({ msg: 'Policy has been added successfully', sev: 'success' }));
                    if (onSaved) onSaved('create');
                })
                .catch((error) => {
                    const errorMsg = extractErrorMessage(error) || 'Save Failed';
                    dispatch(notify({ msg: errorMsg, sev: 'warning' }));
                });
        } else {
            let errorMsg = "";
            if (!policyUpdateDTO.facilityId) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Facility is required"
                else
                    errorMsg = errorMsg + ", Facility is required"
            }
            if (!policyUpdateDTO.name) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Name is required"
                else
                    errorMsg = errorMsg + ", Name is required"
            }
            if (
                !policyUpdateDTO.code
            ) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Code is required";
                else
                    errorMsg = errorMsg + ", Code is required";
            }
            if (errorMsg) {
                dispatch(notify({ msg: errorMsg, sev: 'warning' }));
                return;
            }
            updatePolicy(policyUpdateDTO)
                .unwrap()
                .then(() => {
                    setOpen(false);
                    dispatch(notify({ msg: 'Policy has been updated successfully', sev: 'success' }));
                    if (onSaved) onSaved('update');
                })
                .catch((error) => {
                    const errorMsg = extractErrorMessage(error) || 'Save Failed';
                    dispatch(notify({ msg: errorMsg, sev: 'warning' }));
                });
        }
    };
    // Main modal content
    const conjureFormContentOfMainModal = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid>
                        <MyInput
                            placeholder="Select Facility"
                            width="100%"
                            fieldType="select"
                            fieldLabel="Facility"
                            selectData={facilityListResponse ?? []}
                            selectDataLabel="name"
                            selectDataValue="id"
                            fieldName="facilityId"
                            record={!policy?.id ? policyCreateDTO : policyUpdateDTO}
                            setRecord={!policy?.id ? setPolicyCreateDTO : setPolicyUpdateDTO}
                            searchable={false}
                            required
                        />
                        <Row>
                            <Col md={12}>
                                <MyInput
                                    width="100%"
                                    fieldName="name"
                                    record={!policy?.id ? policyCreateDTO : policyUpdateDTO}
                                    setRecord={!policy?.id ? setPolicyCreateDTO : setPolicyUpdateDTO}
                                    required
                                />
                            </Col>
                            <Col md={12}>
                                <MyInput
                                    width="100%"
                                    fieldName="code"
                                    record={!policy?.id ? policyCreateDTO : policyUpdateDTO}
                                    setRecord={!policy?.id ? setPolicyCreateDTO : setPolicyUpdateDTO}
                                    required
                                />
                            </Col>
                        </Row>
                        <MyInput
                            width="100%"
                            fieldName="description"
                            fieldType='textarea'
                            record={!policy?.id ? policyCreateDTO : policyUpdateDTO}
                            setRecord={!policy?.id ? setPolicyCreateDTO : setPolicyUpdateDTO}
                        />

                    </Form>
                );
        }
    };

    return (
        <MyModal
            actionButtonLabel={policy?.id ? 'Save' : 'Create'}
            actionButtonFunction={handleSave}
            open={open}
            setOpen={setOpen}
            position="right"
            title={policy?.id ? 'Edit Policy' : 'New Policy'}
            content={conjureFormContentOfMainModal}
            steps={[
                {
                    title: 'Basic Info',
                    icon: <GrTestDesktop />
                }
            ]}
            size={"40vw"}
        />
    );
};
export default AddEditPolicy;
