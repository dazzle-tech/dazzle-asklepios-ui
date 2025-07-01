import MyButton from "@/components/MyButton/MyButton";
import { useAppDispatch } from "@/hooks";
import { useGetOperationListQuery, useSaveOperationMutation, useRemoveOperationMutation } from "@/services/operationService";
import { newApOperationSetup } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useEffect, useState } from "react";
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { Form, Panel } from "rsuite";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { ApOperationSetup } from "@/types/model-types";
import { FaUndo } from "react-icons/fa";
import AddEditOperation from "./AddEditOperation";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import MyInput from "@/components/MyInput";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { addFilterToListRequest, fromCamelCaseToDBName } from "@/utils";
const OperationSetup = () => {
    const dispatch = useAppDispatch();
    const [popupOpen, setPopupOpen] = useState(false);// open add/edit pop up
    const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
    const [openConfirmDeleteProcedureModal, setOpenConfirmDeleteProcedureModal] =
        useState<boolean>(false);
    const [stateOfDeleteOperationModal, setStateOfDeleteOperationModal] = useState<string>('delete');
    const [operation, setOperation] = useState({ ...newApOperationSetup });
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 15
    });
    // class name for selected row
    const isSelected = rowData => {
        if (rowData && operation && rowData.key === operation.key) {
            return 'selected-row';
        } else return '';
    };
    const { data: operationList, refetch } = useGetOperationListQuery({ ...initialListRequest });
    const [saveOperation] = useSaveOperationMutation();
    // remove procedure
    const [removeOperation] = useRemoveOperationMutation();
    const handleReactivate = () => {
        saveOperation({ ...operation, deletedAt: null }).unwrap()
            .then(() => {
                refetch();
            });
        //   setOpenConfirmDeleteOperationModal(false);
    };
    // handle deactivate procedure
    const handleDeactivate = () => {
        removeOperation({ ...operation })
            .unwrap()
            .then(() => {
                refetch();
            });
        setOpenConfirmDeleteProcedureModal(false);
    };
    // Icons column (Edit, reactive/Deactivate)
    const iconsForActions = (rowData: ApOperationSetup) => (
        <div className="container-of-icons-procedure">
            <MdModeEdit
                className="icons-procedure"
                title="Edit"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => setPopupOpen(true)}
            />
            {!rowData?.deletedAt ? (
                <MdDelete
                    className="icons-procedure"
                    title="Deactivate"
                    size={24}
                    fill="var(--primary-pink)"
                    onClick={() => {
                        setStateOfDeleteOperationModal('deactivate');
                        setOpenConfirmDeleteProcedureModal(true);
                    }}
                />
            ) : (
                <FaUndo
                    className="icons-procedure"
                    title="Activate"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        setStateOfDeleteOperationModal('reactivate');
                        //   setOpenConfirmDeleteProcedureModal(true);
                    }}
                />
            )}
        </div>
    );
    // handle click on add new button
    const handleNew = () => {
        setOperation({ ...newApOperationSetup, categoryLkey: null });
        setPopupOpen(true);
    };
    // Available fields for filtering
    const filterFields = [
        { label: 'Operation Name', value: 'name' },
        { label: 'Category', value: 'category' }
    ];

    //Table columns
    const tableColumns = [
        {
            key: 'name',
            title: <Translate>Operation Name</Translate>,
            flexGrow: 4
        },
        {
            key: 'code',
            title: <Translate>Procedure Code</Translate>,
            flexGrow: 4
        },
        {
            key: 'category',
            title: <Translate>Category</Translate>,
            flexGrow: 4,
            render: rowData =>
                rowData.categoryLkey ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
        },
        {
            key: 'isAppointable',
            title: <Translate>Appointable</Translate>,
            flexGrow: 4,
            render: rowData => (rowData?.isAppointable ? 'YES' : 'NO')
        },
        {
            key: 'isValid',
            title: <Translate>Status</Translate>,
            flexGrow: 4,
            render: rowData => (!rowData.deletedAt ? 'Valid' : 'InValid')
        },
        {
            key: 'icons',
            title: <Translate></Translate>,
            flexGrow: 3,
            render: rowData => iconsForActions(rowData)
        }
    ];
    // handle filter change
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'containsIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const filters = () => (
        <Form layout="inline" fluid className="container-of-filter-fields-procedure">
            <MyInput
                selectDataValue="value"
                selectDataLabel="label"
                selectData={filterFields}
                fieldName="filter"
                fieldType="select"
                record={recordOfFilter}
                setRecord={updatedRecord => {
                    setRecordOfFilter({
                        ...recordOfFilter,
                        filter: updatedRecord.filter,
                        value: ''
                    });
                }}
                showLabel={false}
                placeholder="Select Filter"
                searchable={false}
            />
            <MyInput
                fieldName="value"
                fieldType="text"
                record={recordOfFilter}
                setRecord={setRecordOfFilter}
                showLabel={false}
                placeholder="Search"
            />
        </Form>
    );

    // Effects
    // update list when filter is changed
    useEffect(() => {
        if (recordOfFilter['filter']) {
            handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
        } else {
            setListRequest({
                ...initialListRequest,
                pageSize: listRequest.pageSize,
                pageNumber: 1
            });
        }
    }, [recordOfFilter]);

    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent('  '));
        };
    }, [location.pathname, dispatch]);
    return (<Panel>
        <div className="container-of-add-new-button-procedure">
            <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleNew}
                width="109px"
            >
                Add New
            </MyButton>
        </div>
        <MyTable
            data={operationList?.object || []}
            columns={tableColumns}
            rowClassName={isSelected}
            filters={filters()}
            onRowClick={rowData => {
                setOperation(rowData);
            }}

        />
        <DeletionConfirmationModal
            open={openConfirmDeleteProcedureModal}
            setOpen={setOpenConfirmDeleteProcedureModal}
            itemToDelete="Operation"
            actionButtonFunction={!operation?.deletedAt ? handleDeactivate : handleReactivate}
            actionType={stateOfDeleteOperationModal}
        />
        <AddEditOperation
            open={popupOpen} setOpen={setPopupOpen}
            operation={operation} setOperation={setOperation}
            refetch={refetch} />
    </Panel>);
}
export default OperationSetup;
