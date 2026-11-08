
import React, { useEffect, useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAddConfigurationMutation, useSearchConfigurationUsersQuery, useUpdateConfigurationMutation } from '@/services/setup/systemConfiguration/systemConfigurationService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Configuration, ConfigurationCreateVM, ConfigurationUpdateVM, ConfigurationUser } from '@/types/model-types-new';
import { newConfigurationCreateVM, newConfigurationUpdateVM } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type UserOption = { id: number; displayName: string };

const userLabel = (user?: Pick<ConfigurationUser, 'id' | 'firstName' | 'lastName' | 'login'>) => {
    if (!user) return '';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.login || `User ${user.id}`;
};

const toUserOption = (user: ConfigurationUser): UserOption => ({
    id: user.id,
    displayName: userLabel(user)
});

const isBooleanOn = (value: unknown) =>
    value === true || String(value ?? '').trim().toLowerCase() === 'true';

const toFormValue = (valueType: string | undefined, value: unknown) =>
    valueType === 'BOOLEAN' ? isBooleanOn(value) : value;

const toApiBody = (vm: ConfigurationCreateVM | ConfigurationUpdateVM) => {
    const { userId, ...rest } = vm;
    return {
        ...rest,
        facilityId: vm.facilityId || undefined,
        userIds: userId ? [Number(userId)] : [],
        value: vm.valueType === 'BOOLEAN' ? (isBooleanOn(vm.value) ? 'true' : 'false') : vm.value
    };
};

const saveErrorMessage = (error: any) => {
    const data = error?.data ?? {};
    const text = `${data.message ?? ''} ${data.detail ?? ''} ${data.title ?? ''}`;
    if (text.includes('duplicatekey') || text.includes('Duplicate configuration key')) {
        return 'This key already exists for that organization, facility, or user';
    }
    if (text.includes('facilityrequired') || text.includes('requires a facility')) {
        return 'Select a facility before assigning a user';
    }
    return 'Unexpected error';
};
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
    const activeRecord = configuration?.id ? updateVM : createVM;
    const setActiveRecord = (updated: any) => {
        if (configuration?.id) setUpdateVM(updated);
        else setCreateVM(updated);
    };
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(0);
    const [userOptions, setUserOptions] = useState<UserOption[]>([]);
    const { data: userSearchResponse, isFetching: loadingUsers } = useSearchConfigurationUsersQuery(
        {
            searchText: userSearch || undefined,
            facilityId: activeRecord.facilityId,
            page: userPage,
            size: 10
        },
        { skip: !open || !activeRecord.facilityId }
    );

    const applyRecord = (updated: any) => {
        if (updated.facilityId !== activeRecord.facilityId) {
            setActiveRecord({ ...updated, userId: undefined, userIds: [] });
            setUserSearch('');
            setUserPage(0);
            setUserOptions([]);
            return;
        }
        setActiveRecord(updated);
    };

    // when click on save button display a confirmation message if there is no facility
    const handleClickSave = () => {
        const record = configuration?.id ? updateVM : createVM;
        if (record.userId && !record.facilityId) {
            dispatch(notify({ msg: 'Select a facility before assigning a user', sev: 'warning' }));
            return;
        }
        if (!configuration?.id && !record.facilityId) {
            setOpenConfirmationMessage(true);
            return;
        }
        handleSave();
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
        const record = configuration?.id ? updateVM : createVM;
        const valueMissing = record.valueType === 'BOOLEAN'
            ? false
            : record.value === undefined || record.value === null || String(record.value).trim() === '';
        if (valueMissing) {
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
                addConfiguration(toApiBody(createVM) as ConfigurationCreateVM)
                    .unwrap()
                    .then(() => {
                        setCreateVM({ ...newConfigurationCreateVM });
                        setOpen(false);
                        dispatch(notify({ msg: 'Configuration added successfully', sev: 'success' }));
                    })
                    .catch((e) => {
                        dispatch(notify({ msg: saveErrorMessage(e), sev: 'error' }));
                    });
            } else {
                // update
                updateConfiguration({ id: configuration.id, body: toApiBody(updateVM) as ConfigurationUpdateVM })
                    .unwrap()
                    .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); setOpen(false); })
                    .catch((e) => {
                        dispatch(notify({ msg: saveErrorMessage(e), sev: 'error' }));
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
                                        record={activeRecord}
                                        setRecord={applyRecord}
                                    />
                                </Col>
                                <Col md={12}>
                                    <MyInput
                                        width="100%"
                                        fieldLabel="User"
                                        fieldType="selectPagination"
                                        fieldName="userId"
                                        selectData={userOptions}
                                        selectDataLabel="displayName"
                                        selectDataValue="id"
                                        record={activeRecord}
                                        setRecord={(updated: any) => {
                                            if (!updated?.userId) {
                                                setActiveRecord({ ...updated, userId: undefined, userIds: [] });
                                                return;
                                            }
                                            setActiveRecord({ ...updated, userIds: [Number(updated.userId)] });
                                        }}
                                        searchable
                                        searchKeyWard={userSearch}
                                        setSearchKeyWard={(keyword: string) => {
                                            setUserPage(0);
                                            setUserSearch(keyword);
                                        }}
                                        placeholder={activeRecord.facilityId ? 'Search user' : 'Select a facility first'}
                                        disabled={!activeRecord.facilityId}
                                        loading={loadingUsers}
                                        hasMore={!!userSearchResponse?.links?.next}
                                        onFetchMore={() => {
                                            if (userSearchResponse?.links?.next) {
                                                const { page } = extractPaginationFromLink(userSearchResponse.links.next);
                                                setUserPage(page);
                                            }
                                        }}
                                    />
                                </Col>
                            </Row>
                            <br />
                            <Row>
                                <Col md={24}>
                                    <MyInput
                                        width="100%"
                                        fieldName="key"
                                        fieldType="select"
                                        selectData={configurationKeysEnumList ?? []}
                                        selectDataLabel="label"
                                        selectDataValue="value"
                                        record={activeRecord}
                                        setRecord={setActiveRecord}
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
                                        record={activeRecord}
                                        setRecord={(value) => setActiveRecord({ ...activeRecord, valueType: value.valueType, value: "" })}
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
                                            record={activeRecord}
                                            setRecord={setActiveRecord}
                                            required
                                        />)
                                        : (valueType === 'BOOLEAN') ? (
                                            <MyInput
                                                width="100%"
                                                fieldName="value"
                                                fieldLabel="Value"
                                                fieldType='checkbox'
                                                record={activeRecord}
                                                setRecord={setActiveRecord}
                                                required
                                            />) : (
                                            <MyInput
                                                width="100%"
                                                fieldName="value"
                                                fieldLabel="Value"
                                                record={activeRecord}
                                                setRecord={setActiveRecord}
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
                                record={activeRecord}
                                setRecord={setActiveRecord}
                                searchable={false}
                                required
                            />
                            <MyInput
                                width="100%"
                                fieldName="description"
                                fieldLabel="Description"
                                fieldType='textarea'
                                record={activeRecord}
                                setRecord={setActiveRecord}
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
        if (!open) return;
        setUserSearch('');
        setUserPage(0);
        if (configuration?.id) {
            const selectedUsers = (configuration.users ?? []).map(toUserOption);
            setUserOptions(selectedUsers);
            const firstUser = configuration.users?.[0];
            setUpdateVM({
                id: configuration.id,
                key: configuration.key,
                value: toFormValue(configuration.valueType, configuration.value) as string,
                valueType: configuration.valueType,
                referenceType: configuration.referenceType,
                description: configuration.description,
                facilityId: configuration.facility?.id,
                userId: firstUser?.id,
                userIds: (configuration.users ?? []).map(user => user.id),
                isActive: configuration?.isActive
            });
        } else {
            setCreateVM({ ...newConfigurationCreateVM });
            setUserOptions([]);
        }
    }, [configuration, open]);

    useEffect(() => {
        if (!userSearchResponse?.data) return;
        const incoming = userSearchResponse.data.map(toUserOption);
        setUserOptions(prev => {
            const selectedId = activeRecord.userId;
            const known = [...(configuration?.users ?? []).map(toUserOption), ...prev];
            const selected = known.find(option => option.id === selectedId);
            const merged = userPage === 0 ? incoming : [...prev, ...incoming];
            const byId = new Map<number, UserOption>();
            if (selected) byId.set(selected.id, selected);
            merged.forEach(option => byId.set(option.id, option));
            return Array.from(byId.values());
        });
    }, [userSearchResponse, userPage, activeRecord.userId, configuration]);

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
