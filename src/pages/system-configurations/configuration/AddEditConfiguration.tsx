
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
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

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    configuration: Configuration | null;
    width?: number;
}

const AddEditConfiguration: React.FC<Props> = ({ open, setOpen, configuration, width = window.innerWidth }) => {
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
    const { data: facilityListResponse, refetch: refetchFacility, isFetching } = useGetAllFacilitiesQuery({});

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
                isActive:  configuration?.isActive
            });
        }
    }, [configuration]);

    

    const handleClickSave = () => {
         if (configuration?.id){
           if(!updateVM.facilityId){
             setOpenConfirmationMessage(true);
           }
           else{
            handleSave();
           }
         }
         else{
             if(!createVM.facilityId){
             setOpenConfirmationMessage(true);
           }
           else{
            handleSave();
           }
         }
    }

    const handleSave = () => {
        setOpen(false);
        setOpenConfirmationMessage(false);
        if (!configuration?.id) {
            console.log("in if 1");
            console.log("createVM");
            console.log(createVM);
            addConfiguration(createVM)
                .unwrap()
                .then(() => {
                    setCreateVM({ ...newConfigurationCreateVM });
                    dispatch(notify({ msg: 'Configuration added successfully', sev: 'success' }));
                })
                .catch((e) => { dispatch(notify({ msg: 'Failed to add configuration', sev: 'error' })); console.log("erroer"); console.log(e); } );
        } else {
              console.log("in else 1");
            console.log("updateVM");
            console.log(updateVM);
            updateConfiguration({ id: configuration.id, body: updateVM })
                .unwrap()
                .then(() => dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })))
                .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));
        }
    };

    // useEffect(() => {
    //     if (configuration?.id) {
    //         setUpdateVM({ ...updateVM, value: '' });
    //     }
    //     else {
    //         setCreateVM({ ...createVM, value: '' });
    //     }
    // }, [createVM.valueType, updateVM.valueType])

    return (
        <MyModal
            open={open}
            position='right'
            setOpen={setOpen}
            title={configuration?.id ? 'Edit Configuration' : 'New Configuration'}
            actionButtonLabel={configuration?.id ? 'Save' : 'Create'}
            actionButtonFunction={handleClickSave}
            size={width > 600 ? '36vw' : '70vw'}
            content={() => (
                <Form fluid>
                    <MyInput
                        fieldLabel="Facility"
                        selectData={facilityListResponse ?? []}
                        fieldType="select"
                        selectDataLabel="name"
                        selectDataValue="id"
                        fieldName="facilityId"
                        record={configuration?.id ? updateVM : createVM}
                        setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                    />
                    {/* <MyInput
                        fieldName="key"
                        fieldLabel="Key"
                        record={configuration?.id ? updateVM : createVM}
                        setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                        required
                    /> */}
                     <MyInput
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
                    <MyInput
                        fieldName="valueType"
                        fieldType="select"
                        selectData={configurationValueTypeEnumList ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={configuration?.id ? updateVM : createVM}
                        // setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                         setRecord={(value) => configuration?.id ? setUpdateVM({...updateVM, valueType: value.valueType, value: ""}) : setCreateVM({...createVM, valueType: value.valueType, value: ""})}
                        disabled={configuration?.id ? true : false}
                        searchable={false}
                        required
                    />
                    {(valueType === 'INTEGER' || valueType === 'DECIMAL') ? (
                        <MyInput
                            fieldName="value"
                            fieldLabel="Value"
                            fieldType='number'
                            record={configuration?.id ? updateVM : createVM}
                            setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                            required
                        />)
                        : (valueType === 'BOOLEAN') ? (<MyInput
                            fieldName="value"
                            fieldLabel="Value"
                            fieldType='checkbox'
                            record={configuration?.id ? updateVM : createVM}
                            setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                            required
                        />) : (<MyInput
                            fieldName="value"
                            fieldLabel="Value"
                            record={configuration?.id ? updateVM : createVM}
                            setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                            required
                        />)}
                        <MyInput
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
                        fieldName="description"
                        fieldLabel="Description"
                        fieldType='textarea'
                        record={configuration?.id ? updateVM : createVM}
                        setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                        required
                    />
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
            )}
        />
    );
};

export default AddEditConfiguration;
