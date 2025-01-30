import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import SearchIcon from '@rsuite/icons/Search';
import { MdSave } from 'react-icons/md';
import { Tabs, Placeholder } from 'rsuite';
import ReloadIcon from '@rsuite/icons/Reload';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
const PotintialDuplicate = () => {
    const [isactive, setIsactive] = useState(false);
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [popupOpen, setPopupOpen] = useState(false);
    const dispatch = useAppDispatch();



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
    return (<>
        <Panel
            header={
                <h3 className="title">
                    <Translate>Potintial Duplicate</Translate>
                </h3>
            }
        >
            <ButtonToolbar>
                <IconButton appearance="primary"
                    icon={<AddOutlineIcon />}
                //    onClick={handleNew}
                >
                    Add New
                </IconButton>
                <IconButton

                    //   disabled={!agegroups.key}
                    appearance="primary"
                    //   onClick={() => setPopupOpen(true)}
                    color="cyan"
                    icon={<EditIcon />}
                >
                    Edit Selected
                </IconButton>
                {!isactive &&
                    <IconButton
                        // disabled={!procedure.key}
                        // onClick={()=>{
                        //     removeProcedure({...procedure}).unwrap().then(()=>{
                        //         profetch();
                        //     });
                        //     setIsactive(true);
                        // }}
                        appearance="primary"
                        color="violet"
                        icon={<TrashIcon />

                        }
                    >
                        Deactivate
                    </IconButton>}

                {
                    isactive &&
                    <IconButton
                        color="orange"
                        appearance="primary"
                        // onClick={()=>{
                        //     saveProcedure({...procedure,deletedAt:null}).unwrap().then(()=>{
                        //         profetch();
                        //     });
                        //     setIsactive(false);
                        // }}
                        icon={<ReloadIcon />}
                    // disabled={!procedure.key}
                    >
                        <Translate> Activate</Translate>
                    </IconButton>

                }
            </ButtonToolbar>
            <hr />

            <Table
                height={400}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                    if (sortBy)
                        setListRequest({
                            ...listRequest,
                            sortBy,
                            sortType
                        });
                }}
                headerHeight={80}
                rowHeight={60}
                bordered
                cellBordered
                data={[]}
            // onRowClick={rowData => {
            //     setProcedure(rowData);
            // }}
            // rowClassName={isSelected}
            >
                <Column sortable flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('name', e)} />
                        <Translate>Procedure Name</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.name}
                    </Cell  >
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('name', e)} />
                        <Translate>Procedure Code</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.code}
                    </Cell  >
                </Column>
                <Column sortable flexGrow={3}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('name', e)} />
                        <Translate> Category </Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.categoryLkey ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey}
                    </Cell  >
                </Column>

                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('isValid', e)} />
                        <Translate>status</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.deletedAt ? 'invalid' : 'valid'}
                    </Cell>
                </Column>

            </Table></Panel>
    </>)
}
export default PotintialDuplicate;