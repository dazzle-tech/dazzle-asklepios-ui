import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import { ApRoom } from '@/types/model-types';
import { newApRoom } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetRoomListQuery, useDeactiveActivRoomMutation } from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import AddEditRoom from './AddEditRoom';
import { FaBed } from "react-icons/fa";
import { FaConciergeBell } from 'react-icons/fa';
import './styles.less';
import AddBed from './AddBed';
import AddService from './AddService';
const Room = () => {
    const dispatch = useAppDispatch();
    const [room, setRoom] = useState<ApRoom>({ ...newApRoom });
    const [openAddBedModal, setAddBedModal] = useState(false);
    const [openConfirmDeleteRoomModal, setOpenConfirmDeleteRoomModal] = useState<boolean>(false);
    const [stateOfDeleteRoomModal, setStateOfDeleteRoomModal] = useState<string>('delete');
    const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
      const [openAddServicePopup, setOpenAddServicePopup] = useState(false);
    const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest, filters: [] });

    // Fetch Room list response
    
    const {
        data: roomListResponseLoading,
        refetch,
        isFetching
    } = useGetRoomListQuery(listRequest);
    // deactivate/reactivate Room
    const [deactiveActiveRoom] = useDeactiveActivRoomMutation();
 
    // Pagination values
    const pageIndex = listRequest.pageNumber - 1;
    const rowsPerPage = listRequest.pageSize;
    const totalCount = roomListResponseLoading?.extraNumeric ?? 0;
    // Available fields for filtering
    const filterFields = [
        { label: 'Room Name', value: 'name' },
        { label: 'Floor', value: 'floor' },
        { label: 'Location Details', value: 'locationDetails' },
    ];
    // Header page setUp
    const divContent = (
        <div className='page-title'>
            <h5>Rooms</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Rooms'));
    dispatch(setDivContent(divContentHTML));
    // class name for selected row
    const isSelected = rowData => {
        if (rowData && room && room.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };


    // handle click om edit Room
    const handleEdit = () => {
        setOpenAddEditPopup(true);
    };
    // handle filter change
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'startsWithIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const handlePageChange = (_: unknown, newPage: number) => {
        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };
    // Handle change rows per page in navigation
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListRequest({
            ...listRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1
        });
    };
    // Handle add new Room
    const handleAddRoom = () => {
        setRoom({ ...newApRoom });
        setOpenAddEditPopup(true);
    };
    // handle Deactive Reactivate Room
    const handleDeactiveReactivateRoom = () => {
        deactiveActiveRoom(room)
            .unwrap()
            .then(() => {
                refetch();
                if (room.isValid) {
                    dispatch(notify('Room Deactived Successfully'));
                } else {
                    dispatch(notify('Room Activated Successfully'));
                }
                setRoom(newApRoom);
            });
        setOpenConfirmDeleteRoomModal(false);
    };
    // Filter table
    const filters = () => (
        <Form layout="inline" fluid>
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
    // Icons column (Edit,Add Bed, reactive/Deactivate)
    const iconsForActions = (rowData: ApRoom) => (
        <div className="container-of-icons">
            <FaConciergeBell 
               className="icons-style"
                title="Add Service"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => {
                    setOpenAddServicePopup(true);
                }}  />
            <FaBed
                className="icons-style"
                title="Add Bed"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => {
                    setAddBedModal(true);
                }} />
            <MdModeEdit
                className="icons-style"
                title="Edit"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => handleEdit()}
            />
            {rowData?.isValid ? (
                <MdDelete
                    className="icons-style"
                    title="Deactivate"
                    size={24}
                    fill="var(--primary-pink)"
                    onClick={() => {
                        setStateOfDeleteRoomModal('deactivate');
                        setOpenConfirmDeleteRoomModal(true);
                    }}
                />
            ) : (
                <FaUndo
                    className="icons-style"
                    title="Activate"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        setStateOfDeleteRoomModal('reactivate');
                        setOpenConfirmDeleteRoomModal(true);
                    }}
                />
            )}
        </div>
    );
    //Table columns
    const tableColumns = [
        {
            key: 'name',
            title: <Translate>Room Name</Translate>,
            flexGrow: 4
        },
        {
            key: 'facilityKey',
            title: <Translate>Facility</Translate>,
            flexGrow: 4,
            render: rowData => rowData?.facility?.facilityName
        },
        {
            key: 'departmentKey',
            title: <Translate>Department</Translate>,
            flexGrow: 4,
            render: rowData => rowData?.department?.name
        },
        {
            key: 'floor',
            title: <Translate>Floor</Translate>,
            flexGrow: 4
        },
        {
            key: 'locationDetails',
            title: <Translate>Location Details</Translate>,
            flexGrow: 4
        },
        {
            key: 'typeLkey',
            title: <Translate>Type</Translate>,
            flexGrow: 4,
            render: rowData =>
                rowData?.typeLvalue
                    ? rowData.typeLvalue.lovDisplayVale
                    : rowData.typeLkey
        },
        {
            key: 'genderLkey',
            title: <Translate>Gender Spacific</Translate>,
            flexGrow: 4,
            render: rowData =>
                rowData?.genderLvalue
                    ? rowData.genderLvalue.lovDisplayVale
                    : rowData.genderLkey
        },
        {
            key: 'isValid',
            title: <Translate>Status</Translate>,
            flexGrow: 4,
            render: rowData => (rowData.isValid ? 'Valid' : 'InValid')
        },
         {
            key: 'bedCount',
            title: <Translate>Bed Count</Translate>,
            flexGrow: 4,
            render: rowData =>
                rowData?.bedCount
                    ? rowData.bedCount
                    : '0'
        },
        {
            key: 'icons',
            title: <Translate></Translate>,
            flexGrow: 3,
            render: rowData => iconsForActions(rowData)
        }
    ];
    //useEffect
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

    return (
        <Panel>
            <div className="container-of-add-new-button">
                <MyButton
                    prefixIcon={() => <AddOutlineIcon />}
                    color="var(--deep-blue)"
                    onClick={handleAddRoom}
                    width="109px"
                >
                    Add New
                </MyButton>
            </div>
            <MyTable
                height={450}
                data={roomListResponseLoading?.object ?? []}
                loading={isFetching}
                columns={tableColumns}
                rowClassName={isSelected}
                filters={filters()}
                onRowClick={rowData => {
                    setRoom(rowData);
                }}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortChange={(sortBy, sortType) => {
                    if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
                }}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <DeletionConfirmationModal
                open={openConfirmDeleteRoomModal}
                setOpen={setOpenConfirmDeleteRoomModal}
                itemToDelete="Room"
                actionButtonFunction={handleDeactiveReactivateRoom}
                actionType={stateOfDeleteRoomModal}
            />
            <AddEditRoom
                open={openAddEditPopup}
                setOpen={setOpenAddEditPopup}
                room={room}
                setRoom={setRoom}
                refetch={refetch} />
            <AddBed
                open={openAddBedModal}
                setOpen={setAddBedModal}
                room={room}
                setRoom={setRoom}
                refetchRoom={refetch}
            />
            <AddService
                open={openAddServicePopup}
                setOpen={setOpenAddServicePopup}
                roomObj={room}
                setRoomObj={setRoom}/>
        </Panel>
    );
};

export default Room;
