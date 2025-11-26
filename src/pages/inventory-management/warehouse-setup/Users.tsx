import React, { useEffect, useState } from 'react';
import {
    useGetLovValuesByCodeQuery,
    useGetUsersQuery,
    useGetWarehouseUserQuery,
    useRemoveWarehouseUserMutation,
    useSaveWarehouseUserMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApWarehouseUser } from '@/types/model-types';
import { newApWarehouseUser } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { FaUser } from 'react-icons/fa6';
const Users = ({ open, setOpen, warehouse, setWarehouse, refetch }) => {
    const dispatch = useAppDispatch();
    const [warehouseUser, setWarehouseUser] = useState<ApWarehouseUser>({ ...newApWarehouseUser });
    const [openConfirmRemoveWarehouseUser, setOpenConfirmRemoveWarehouseUser] =
        useState<boolean>(false);
    const [openChildModal, setOpenChildModal] = useState<boolean>(false);
    const [numDisplayValue, setNumDisplayValue] = useState('');
    const [warehouseUserListRequest, setWarehouseUserListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
             {
                            fieldName: 'warehouse_key',
                            operator: 'match',
                            value: warehouse.key
                        }
        ]
    });
        const [userListRequest, setUserListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            // {
            //     fieldName: 'organization_key',
            //     operator: 'isNull',
            //     value: warehouse?.departmentKey
            // },
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    // Fetch users  list response
    const { data: userListQueryResponce, refetch: refetchUserList } = useGetUsersQuery(userListRequest);
   
    const { data: warehouseUserListResponse, refetch: refetchWarehouseUsers } =
        useGetWarehouseUserQuery(warehouseUserListRequest);
    // remove Warehouse User
    const [removeWarehouseUser] = useRemoveWarehouseUserMutation();
    // save Warehouse User
    const [saveWarehouseUser , setSaveWarehouseUser] = useSaveWarehouseUserMutation();

    // class name for selected row in warehouse table
    const isSelectedWarehouseUser = rowData => {
        if (rowData && warehouseUser && warehouseUser.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

    // update list of warehouse Users when warehouse is changed
    useEffect(() => {
        setWarehouseUserListRequest(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined
                },
                 {
                            fieldName: 'warehouse_key',
                            operator: 'match',
                            value: warehouse.key
                        }
            ]
        }));

        setUserListRequest(prev => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined
                },
            //              {
            //     fieldName: 'organization_key',
            //     operator: 'isNull',
            //     value: warehouse?.departmentKey
            // }
            ]
        }));
    }, [warehouse?.key]);

    // handle delete warehouse user
    const handleDeleteWarehouseUser = () => {
        removeWarehouseUser({...warehouseUser})
            .unwrap()
            .then(() => {
                setWarehouseUser(newApWarehouseUser);
                setOpenConfirmRemoveWarehouseUser(false);
                dispatch(notify('Warehouse User Deleted Successfully'));
                refetchWarehouseUsers();
                setWarehouseUser({
                    ...newApWarehouseUser,
                    warehouseKey: warehouse.key
                });
            });
    };
    // Icons column (Edite, delete)
    const iconsForActionsInterval = () => (
        <div className="container-of-icons">
            <MdModeEdit
                className="icons"
                title="Edit"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => {
                    setOpenChildModal(true);
                }}
            />
            <MdDelete
                className="icons"
                title="Deactivate"
                size={24}
                fill="var(--primary-pink)"
                onClick={() => setOpenConfirmRemoveWarehouseUser(true)}
            />
        </div>
    );


    const tableColumns = [
        {
            key: 'userKey',
            title: <Translate>User</Translate>,
            flexGrow: 3,
             render: rowData => (
                         <span>
                           {conjureValueBasedOnKeyFromList(
                             userListQueryResponce?.object ?? [],
                             rowData.userKey,
                             'fullName'
                           )}
                         </span>
                       )
        },
        {
            key: 'icons',
            title: <Translate></Translate>,
            flexGrow: 3,
            render: () => iconsForActionsInterval()
        }
    ];
    // handle Save Warehouse User
    const handleSaveWarehouseUser = async () => {
        await saveWarehouseUser({ ...warehouseUser, warehouseKey: warehouse.key }).unwrap();
        dispatch(notify('Warehouse User Added Successfully'));
        refetchWarehouseUsers();
        setWarehouseUser({
            ...newApWarehouseUser,
            warehouseKey: warehouse.key
        });
    };
    // Main modal content
    const conjureFormContentOfMainModal = stepNumber => {
       
                return (
                    <Form>
                        <div className="container-of-add-new-button">
                            <MyButton
                                prefixIcon={() => <AddOutlineIcon />}
                                color="var(--deep-blue)"
                                onClick={() => {
                                    setWarehouseUser({
                                        ...newApWarehouseUser
                                    });
                                    setOpenChildModal(true);
                                }}
                                width="109px"
                            >
                                Add New
                            </MyButton>
                        </div>
                        <MyTable
                            height={450}
                            data={warehouseUserListResponse?.object ??  []}
                            columns={tableColumns}
                            rowClassName={isSelectedWarehouseUser}
                            onRowClick={rowData => {
                                setWarehouseUser(rowData);
                            }}
                            sortColumn={warehouseUserListRequest.sortBy}
                            sortType={warehouseUserListRequest.sortType}
                            onSortChange={(sortBy, sortType) => {
                                if (sortBy)
                                    setWarehouseUserListRequest({
                                        ...warehouseUserListRequest,
                                        sortBy,
                                        sortType
                                    });
                            }}
                        />
                        <DeletionConfirmationModal
                            open={openConfirmRemoveWarehouseUser}
                            setOpen={setOpenConfirmRemoveWarehouseUser}
                            itemToDelete="Warehouse User"
                            actionButtonFunction={handleDeleteWarehouseUser}
                            actionType={'delete'}
                        />
                    </Form>
                );
    
    };
    // Child modal content
    const conjureFormContentOfChildModal = () => {

        return (
            <Form>
                <MyInput
                    required
                    width={350}
                    fieldType="select"
                    fieldLabel="user Name"
                    fieldName="userKey"
                    selectData={userListQueryResponce?.object ?? []}
                    selectDataLabel="fullName"
                    selectDataValue="key"
                    record={warehouseUser}
                    setRecord={setWarehouseUser}
                />
       
            </Form>
        );

    };
    return (
        <ChildModal
            actionButtonLabel={warehouse?.key ? 'Save' : 'Create'}
            actionButtonFunction={() => setOpen(false)}
            actionChildButtonFunction={handleSaveWarehouseUser}
            open={open}
            setOpen={setOpen}
            showChild={openChildModal}
            setShowChild={setOpenChildModal}
            title="Warehouse Users"
            mainContent={conjureFormContentOfMainModal}
            mainStep={[
                {
                    title: 'Warehouse User',
                    icon: <FaUser />,
                    disabledNext: !warehouse?.key,
                }
            ]}
            childTitle="Add User"
            childContent={conjureFormContentOfChildModal}
            mainSize="sm"
        />
    );
};
export default Users;
