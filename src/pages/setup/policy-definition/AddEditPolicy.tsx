import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { GrTestDesktop } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
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

const AddEditPolicy = ({ open, setOpen, policy, setPolicy }) => {
    const dispatch = useAppDispatch();
    const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

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

    const handleSave = () => {
        if (!policy?.id) {
            createPolicy(policyCreateDTO)
                .unwrap()
                .then(() => {
                     setOpen(false);
                    setPolicyCreateDTO({ ...newPolicyDefinitionCreateDTO });
                    dispatch(notify({ msg: 'Policy has been added successfully', sev: 'success' }));
                })
                .catch(() => {
                    dispatch(notify({ msg: 'Failed to add this Policy', sev: 'error' }));
                });
        } else {
            updatePolicy(policyUpdateDTO)
                .unwrap()
                .then(() => {
                     setOpen(false);
                    dispatch(notify({ msg: 'Policy has been updated successfully', sev: 'success' }));
                })
                .catch(() => {
                    dispatch(notify({ msg: 'Failed to update this Policy', sev: 'error' }));
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
                        />
                        <Row>
                        <Col md={12}>
                        <MyInput
                            width="100%"
                            fieldName="name"
                            record={!policy?.id ? policyCreateDTO : policyUpdateDTO}
                            setRecord={!policy?.id ? setPolicyCreateDTO : setPolicyUpdateDTO}
                        />
                        </Col>
                        <Col md={12}>
                        <MyInput
                            width="100%"
                            fieldName="code"
                            record={!policy?.id ? policyCreateDTO : policyUpdateDTO}
                            setRecord={!policy?.id ? setPolicyCreateDTO : setPolicyUpdateDTO}
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
    // Effects

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
        <MyModal
            actionButtonLabel={policy?.id ? 'Save' : 'Create'}
            actionButtonFunction={handleSave}
            open={open}
            setOpen={setOpen}
            position="right"
            title={policy?.id ? 'Edit Policy' : 'New Policy'}
            content={(stepNumber) => (<div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>)}
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
