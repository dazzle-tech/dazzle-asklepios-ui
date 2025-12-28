// import React from 'react';
// import { Form } from 'rsuite';
// import MyModal from '@/components/MyModal/MyModal';
// import MyInput from '@/components/MyInput';
// import { Configuration } from '@/types/model-types-new';
// import { GrCatalog } from 'react-icons/gr';
// import { useEnumOptions } from '@/services/enumsApi';
// import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';

// const AddEditConfiguration = ({
//     open,
//     setOpen,
//     configuration,
//     onSave
// }) => {
//     const [record, setRecord] = React.useState<Configuration>(
//         configuration ?? { key: '', value: '', facilityId: null }
//     );
//     console.log("record");
//     console.log(record);

//     const configurationValueTypeEnumList = useEnumOptions('ConfigurationValueType');
//     // Fetch Facilities list response
//     const { data: facilityListResponse, refetch: refetchFacility, isFetching } = useGetAllFacilitiesQuery({});

//     React.useEffect(() => {
//         if (configuration) setRecord(configuration);
//     }, [configuration]);

//     return (
//         <MyModal
//             open={open}
//             setOpen={setOpen}
//             title={record?.id ? 'Edit Configuration' : 'New Configuration'}
//             actionButtonLabel={record?.id ? 'Save' : 'Create'}
//             actionButtonFunction={() => onSave(record)}
//             position="right"
//             steps={[
//                 {
//                     title: 'Configuration Info',
//                     icon: <GrCatalog />
//                 }
//             ]}
//             content={() => (
//                 <Form fluid>
//                     <MyInput
//                         fieldName="key"
//                         fieldLabel="Key"
//                         record={record}
//                         setRecord={setRecord}
//                     />

//                     <MyInput
//                         fieldName="valueType"
//                         fieldType="select"
//                         selectData={configurationValueTypeEnumList ?? []}
//                         selectDataLabel="label"
//                         selectDataValue="value"
//                         record={record}
//                         setRecord={setRecord}
//                         searchable={false}
//                     />
//                     <MyInput
//                         fieldName="value"
//                         fieldLabel="Value"
//                         fieldType='number'
//                         record={record}
//                         setRecord={setRecord}
//                     />
//                     {/* <MyInput
//                         fieldName="facilityId"
//                         fieldLabel="Facility ID"
//                         fieldType="number"
//                         record={record}
//                         setRecord={setRecord}
//                     /> */}
//                     <MyInput
//                         fieldLabel="Facility"
//                         selectData={facilityListResponse ?? []}
//                         fieldType="select"
//                         selectDataLabel="name"
//                         selectDataValue="id"
//                         fieldName="facilityId"
//                         record={record}
//                         setRecord={setRecord}
//                     />
//                 </Form>
//             )}
//         />
//     );
// };

// export default AddEditConfiguration;


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
                key: configuration.key,
                value: configuration.value,
                description: configuration.description
            });
        }
    }, [configuration]);

    const handleClickSave = () => {
         if (!configuration?.id){
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
                .catch(() => dispatch(notify({ msg: 'Failed to add configuration', sev: 'error' })));
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

    useEffect(() => {
        if (configuration?.id) {
            setUpdateVM({ ...updateVM, value: '' });
        }
        else {
            setCreateVM({ ...createVM, value: '' });
        }
    }, [createVM.valueType, updateVM.valueType])

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
                        disabled={configuration?.id ? true : false}
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
                        setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                        disabled={configuration?.id ? true : false}
                        searchable={false}
                        required
                    />
                    {(createVM.valueType === 'INTEGER' || createVM.valueType === 'DECIMAL') ? (
                        <MyInput
                            fieldName="value"
                            fieldLabel="Value"
                            fieldType='number'
                            record={configuration?.id ? updateVM : createVM}
                            setRecord={configuration?.id ? setUpdateVM : setCreateVM}
                            required
                        />)
                        : (createVM.valueType === 'BOOLEAN') ? (<MyInput
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
                        disabled={configuration?.id ? true : false}
                        searchable={false}
                        required
                    />
                    <MyInput
                        fieldName="description"
                        fieldLabel="Description"
                        record={configuration?.id ? updateVM : createVM}
                        setRecord={configuration?.id ? setUpdateVM : setCreateVM}
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
