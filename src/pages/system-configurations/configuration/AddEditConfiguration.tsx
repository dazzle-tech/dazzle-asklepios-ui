
import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAddConfigurationMutation, useUpdateConfigurationMutation } from '@/services/setup/systemConfiguration/systemConfigurationService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Configuration, ConfigurationCreateVM, ConfigurationUpdateVM } from '@/types/model-types-new';
import { newConfigurationCreateVM, newConfigurationUpdateVM } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    configuration: Configuration | null;
    width: number;
}

const AddEditConfiguration: React.FC<Props> = ({ open, setOpen, configuration, width }) => {
    const dispatch = useAppDispatch();
    const [createVM, setCreateVM] = useState<ConfigurationCreateVM>({ ...newConfigurationCreateVM });
    const [updateVM, setUpdateVM] = useState<ConfigurationUpdateVM>({ ...newConfigurationUpdateVM });
    const valueType = configuration?.id ? updateVM.valueType : createVM.valueType;
    const [openConfirmationMessage, setOpenConfirmationMessage] = useState<boolean>(false);
    const [addConfiguration] = useAddConfigurationMutation();
    const [updateConfiguration] = useUpdateConfigurationMutation();
    const configurationValueTypeEnumList = useEnumOptions('ConfigurationValueType');
    const configurationKeysEnumList = useEnumOptions('ConfigurationKeys');
    const configurationreferenceTypeEnumList = useEnumOptions('ConfigurationReferenceType');
    const { data: facilityListResponse} = useGetAllFacilitiesQuery({});
    
    // when click on save button display a confirmation message if there is no facility
    const handleClickSave = () => {
        if (configuration?.id) {
            if (!updateVM.facilityId) {
                setOpenConfirmationMessage(true);
            }
            else {
                handleSave();
            }
        }
        else {
            if (!createVM.facilityId) {
                setOpenConfirmationMessage(true);
            }
            else {
                handleSave();
            }
        }
    }

    // save configuration 
    const handleSave = () => {
        let errorMsg = ""; // to display error message indicating the required fields
        if (!createVM.key && !updateVM.key) {
            if (!errorMsg)
                errorMsg = errorMsg + "Key Can`t be empty"
            else
                errorMsg = errorMsg + ", Condition Can`t be empty"
        }
        if (!createVM.valueType && !updateVM.valueType) {
            if (!errorMsg)
                errorMsg = errorMsg + "Value Type Can`t be empty"
            else
                errorMsg = errorMsg + ", Value Type Can`t be empty"
        }
        if (!createVM.value && !updateVM.value) {
            if (!errorMsg)
                errorMsg = errorMsg + "Value Can`t be empty"
            else
                errorMsg = errorMsg + ", Value Can`t be empty"
        }
        if (!createVM.referenceType && !updateVM.referenceType) {
            if (!errorMsg)
                errorMsg = errorMsg + "Reference Type Can`t be empty"
            else
                errorMsg = errorMsg + ", Reference Type Can`t be empty"
        }
        if (!createVM.description && !updateVM.description) {
            if (!errorMsg)
                errorMsg = errorMsg + "Description Can`t be empty"
            else
                errorMsg = errorMsg + ", Description Can`t be empty"
        }
        setOpenConfirmationMessage(false);
        if (!errorMsg) {
            if (!configuration?.id) {  // create
                addConfiguration(createVM)
                    .unwrap()
                    .then(() => {
                        setCreateVM({ ...newConfigurationCreateVM });
                        setOpen(false);
                        dispatch(notify({ msg: 'Configuration added successfully', sev: 'success' }));
                    })
                    .catch((e) => {
                        dispatch(notify({ msg: 'Failed to add configuration', sev: 'error' }));
                        console.log("erroer");
                        console.log(e);
                        const isDuplicateKeyError =
                            e?.status === 400 &&
                            e?.data?.detail?.includes('error.duplicatekey');

                        if (isDuplicateKeyError) {
                            dispatch(notify({ msg: 'Duplicate key for the same facility or globally', sev: 'error' }));
                        } else {
                            dispatch(notify({ msg: 'Unexpected error', sev: 'error' }));
                        }
                    });
            } else {
                // update
                updateConfiguration({ id: configuration.id, body: updateVM })
                    .unwrap()
                    .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); setOpen(false); })
                    .catch((e) => {
                        dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' }));
                        const isDuplicateKeyError =
                            e?.status === 400 &&
                            e?.data?.detail?.includes('error.duplicatekey');

                        if (isDuplicateKeyError) {
                            dispatch(notify({ msg: 'Duplicate key for the same facility or globally', sev: 'error' }));
                        } else {
                            dispatch(notify({ msg: 'Unexpected error', sev: 'error' }));
                        }
                    });
            }
        } else {
            dispatch(notify({ msg: errorMsg, sev: 'warning' }))
        }
    };

    // Main modal content
    const conjureFormContentOfMainModal = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid>
                        <Row>
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldLabel="Facility"
                                        selectData={facilityListResponse ?? []}
                                        fieldType="select"
                                        selectDataLabel="name"
                                        selectDataValue="id"
                                        fieldName="facilityId"
                                        record={configuration?.id ? updateVM : createVM}
                                        setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldName="key"
                                        fieldType="select"
                                        selectData={configurationKeysEnumList ?? []}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        record={configuration?.id ? updateVM : createVM}
                                        setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                                        searchable={false}
                                        required
                                    />
                                </Col>
                            </Row>
                            <br/>
                            <Row>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldName="valueType"
                                        fieldType="select"
                                        selectData={configurationValueTypeEnumList ?? []}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        record={configuration?.id ? updateVM : createVM}
                                        setRecord={(value) => configuration?.id ? setUpdateVM({ ...updateVM, valueType: value.valueType, value: "" }) : setCreateVM({ ...createVM, valueType: value.valueType, value: "" })}
                                        disabled={configuration?.id ? true : false}
                                        searchable={false}
                                        required
                                    />
                                </Col>
                                <Col md={12}>
                                    {(valueType === 'INTEGER' || valueType === 'DECIMAL') ? (
                                        <MyInput
                                            width="100%"
                                            fieldName="value"
                                            fieldLabel="Value"
                                            fieldType='number'
                                            record={configuration?.id ? updateVM : createVM}
                                            setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                                            required
                                        />)
                                        : (valueType === 'BOOLEAN') ? (
                                            <MyInput
                                                width="100%"
                                                fieldName="value"
                                                fieldLabel="Value"
                                                fieldType='checkbox'
                                                record={configuration?.id ? updateVM : createVM}
                                                setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                                                required
                                            />) : (
                                            <MyInput
                                                width="100%"
                                                fieldName="value"
                                                fieldLabel="Value"
                                                record={configuration?.id ? updateVM : createVM}
                                                setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                                                required
                                            />)}
                                </Col>
                            </Row>
                            <br/>
                            <MyInput
                                width="100%"
                                fieldName="referenceType"
                                fieldType="select"
                                selectData={configurationreferenceTypeEnumList ?? []}
                                selectDataLabel="label"
                                selectDataValue="value"
                                record={configuration?.id ? updateVM : createVM}
                                setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                                searchable={false}
                                required
                            />
                            <MyInput
                                width="100%"
                                fieldName="description"
                                fieldLabel="Description"
                                fieldType='textarea'
                                record={configuration?.id ? updateVM : createVM}
                                setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                                required
                            />
                        </Row>
                        <DeletionConfirmationModal
                            open={openConfirmationMessage}
                            setOpen={setOpenConfirmationMessage}
                            itemToDelete='Configuration'
                            actionType="confirm"
                            actionButtonFunction={handleSave}
                            confirmationQuestion={
                                "Are you sure you want to add this configuration without assigning it to a facility?"
                            }
                        />
                    </Form>
                );

        }
    };

    // Effects
    useEffect(() => {
        if (configuration?.id) {
            setUpdateVM({
                id: configuration.id,
                key: configuration.key,
                value: configuration.value,
                valueType: configuration.valueType,
                referenceType: configuration.referenceType,
                description: configuration.description,
                facilityId: Number(configuration?.facility?.id),
                isActive: configuration?.isActive
            });
        }
    }, [configuration]);

    return (
        <MyModal
            open={open}
            position='right'
            setOpen={setOpen}
            title={configuration?.id ? 'Edit Configuration' : 'New Configuration'}
            actionButtonLabel={configuration?.id ? 'Save' : 'Create'}
            actionButtonFunction={handleClickSave}
            size={width > 600 ? '30vw' : '90vw'}
            steps={[
                {
                    title: 'Configuration',
                    icon: <FontAwesomeIcon icon={faSliders} />,
                }
            ]}
            content={conjureFormContentOfMainModal}
        />
    );
};

export default AddEditConfiguration;
