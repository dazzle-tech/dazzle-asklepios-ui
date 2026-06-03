import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { GrTestDesktop } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
    useCreateskillDefinitionMutation,
    useUpdateskillDefinitionMutation
} from '@/services/setup/skillDefinition/skillDefinitionService';
import {
    SkillDefinitionCreateDTO,
    SkillDefinitionUpdateDTO
} from '@/types/model-types-new';
import {
    newSkillDefinitionCreateDTO,
    newSkillDefinitionUpdateDTO
} from '@/types/model-types-constructor-new';

const AddEditSkill = ({ open, setOpen, skill, setSkill, onSaved }) => {
    const dispatch = useAppDispatch();
    const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

    const [skillCreateDTO, setSkillCreateDTO] = useState<SkillDefinitionCreateDTO>({
        ...newSkillDefinitionCreateDTO
    });
    const [skillUpdateDTO, setSkillUpdateDTO] = useState<SkillDefinitionUpdateDTO>({
        ...newSkillDefinitionUpdateDTO
    });

    const [createSkill] = useCreateskillDefinitionMutation();
    const [updateSkill] = useUpdateskillDefinitionMutation();

    useEffect(() => {
        if (skill?.id) {
            setSkillUpdateDTO({
                id: skill.id,
                facilityId: skill.facilityId,
                code: skill.code,
                name: skill.name,
                description: skill.description,
                type: skill.type,
            });
        } else {
            setSkillCreateDTO({
                ...newSkillDefinitionCreateDTO
            });
        }
    }, [skill]);

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
        if (!skill?.id) {
            let errorMsg = "";
            if (!skillCreateDTO.facilityId) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Facility is required"
                else
                    errorMsg = errorMsg + ", Facility is required"
            }
            if (!skillCreateDTO.name) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Name is required"
                else
                    errorMsg = errorMsg + ", Name is required"
            }
            if (
                !skillCreateDTO.code
            ) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Code is required";
                else
                    errorMsg = errorMsg + ", Code is required";
            }
            if (!skillCreateDTO.type) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Type is required";
                else
                    errorMsg = errorMsg + ", Type is required";
            }
            if (errorMsg) {
                dispatch(notify({ msg: errorMsg, sev: 'warning' }));
                return;
            }
            createSkill(skillCreateDTO)
                .unwrap()
                .then(() => {
                    setOpen(false);
                    setSkillCreateDTO({ ...newSkillDefinitionCreateDTO });
                    dispatch(notify({ msg: 'Skill has been added successfully', sev: 'success' }));
                    if (onSaved) onSaved('create');
                })
                .catch((error) => {
                    const errorMsg = extractErrorMessage(error) || 'Save Failed';
                    dispatch(notify({ msg: errorMsg, sev: 'warning' }));
                });
        } else {
            let errorMsg = "";
            if (!skillUpdateDTO.facilityId) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Facility is required"
                else
                    errorMsg = errorMsg + ", Facility is required"
            }
            if (!skillUpdateDTO.name) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Name is required"
                else
                    errorMsg = errorMsg + ", Name is required"
            }
            if (
                !skillUpdateDTO.code
            ) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Code is required";
                else
                    errorMsg = errorMsg + ", Code is required";
            }
            if (!skillUpdateDTO.type) {
                if (!errorMsg)
                    errorMsg = errorMsg + "Type is required";
                else
                    errorMsg = errorMsg + ", Type is required";
            }
            if (errorMsg) {
                dispatch(notify({ msg: errorMsg, sev: 'warning' }));
                return;
            }
            updateSkill(skillUpdateDTO)
                .unwrap()
                .then(() => {
                    setOpen(false);
                    dispatch(notify({ msg: 'Skill has been updated successfully', sev: 'success' }));
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
                            record={!skill?.id ? skillCreateDTO : skillUpdateDTO}
                            setRecord={!skill?.id ? setSkillCreateDTO : setSkillUpdateDTO}
                            searchable={false}
                            required
                        />
                        <Row>
                            <Col md={12}>
                                <MyInput
                                    width="100%"
                                    fieldName="name"
                                    record={!skill?.id ? skillCreateDTO : skillUpdateDTO}
                                    setRecord={!skill?.id ? setSkillCreateDTO : setSkillUpdateDTO}
                                    required
                                />
                            </Col>
                            <Col md={12}>
                                <MyInput
                                    width="100%"
                                    fieldName="code"
                                    record={!skill?.id ? skillCreateDTO : skillUpdateDTO}
                                    setRecord={!skill?.id ? setSkillCreateDTO : setSkillUpdateDTO}
                                    required
                                />
                            </Col>
                        </Row>
                         <Row>
                            <Col md={12}>
                                <MyInput
                                    width="100%"
                                    fieldName="type"
                                    fieldLabel="Type"
                                    record={!skill?.id ? skillCreateDTO : skillUpdateDTO}
                                    setRecord={!skill?.id ? setSkillCreateDTO : setSkillUpdateDTO}
                                    required
                                />
                            </Col>
                        </Row>
                        <MyInput
                            width="100%"
                            fieldName="description"
                            fieldType='textarea'
                            record={!skill?.id ? skillCreateDTO : skillUpdateDTO}
                            setRecord={!skill?.id ? setSkillCreateDTO : setSkillUpdateDTO}
                        />

                    </Form>
                );
        }
    };

    return (
        <MyModal
            actionButtonLabel={skill?.id ? 'Save' : 'Create'}
            actionButtonFunction={handleSave}
            open={open}
            setOpen={setOpen}
            position="right"
            title={skill?.id ? 'Edit Skill' : 'New Skill'}
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
export default AddEditSkill;
