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
import {
    useGetDuplicationCandidateSetupListQuery,
    useSaveDuplicationCandidateSetupMutation
} from '@/services/setupService';
import { ApDuplicationCandidateSetup } from '@/types/model-types';
import { newApDuplicationCandidateSetup } from '@/types/model-types-constructor';
const PotintialDuplicate = () => {
    const [isactive, setIsactive] = useState(false);
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [popupOpen, setPopupOpen] = useState(false);
    const dispatch = useAppDispatch();
    const[candidate,setCandidate]=useState<ApDuplicationCandidateSetup>({...newApDuplicationCandidateSetup})
    const [saveCandidate, saveCandidateMutation] = useSaveDuplicationCandidateSetupMutation();
    const { data: CandidateListResponse ,refetch:candfetch} = useGetDuplicationCandidateSetupListQuery(listRequest);
    const isSelected = rowData => {
        if (rowData && candidate && rowData.key === candidate.key) {
          return 'selected-row';
        } else return '';
      };

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
     const handleNew = () => {
        setCandidate({ ...newApDuplicationCandidateSetup });
        setPopupOpen(true);
      };
      const handleSave = async () => {
        setPopupOpen(false);
        //if you want to use response object write response.object 
        try {
          const response = await saveCandidate(candidate).unwrap().then(()=>{
            candfetch();
          });
         
    
          dispatch(notify("saved sucssecfly"));
          
    
        } catch (error) {
          if (error.data && error.data.message) {
            // Display error message from server
            dispatch(notify(error.data.message));
          } else {
            // Generic error notification
            dispatch(notify("An unexpected error occurred"));
          }
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
                   onClick={handleNew}
                >
                    Add New
                </IconButton>
                <IconButton

                      disabled={!candidate.key}
                    appearance="primary"
                    onClick={() => setPopupOpen(true)}
                    color="cyan"
                    icon={<EditIcon />}
                >
                    Edit Selected
                </IconButton>
                {!isactive &&
                    <IconButton
                        disabled={!candidate.key}
                        onClick={()=>{
                            saveCandidate({...candidate,deletedAt:Date.now()}).unwrap().then(()=>{
                                candfetch();
                            });
                            setIsactive(true);
                        }}
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
                        onClick={()=>{
                            saveCandidate({...candidate,deletedAt:null}).unwrap().then(()=>{
                                candfetch();
                            });
                            setIsactive(false);
                        }}
                        icon={<ReloadIcon />}
                    disabled={!candidate.key}
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
                data={CandidateListResponse?.object??[]}
            onRowClick={rowData => {
                setCandidate(rowData);
            }}
            rowClassName={isSelected}
            >
                <Column sortable flexGrow={1}>
                    <HeaderCell align="center">
                        
                        <Translate>Role</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.role}
                    </Cell  >
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell align="center">
                        
                        <Translate>Date Of Barith</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.dob?"True":"False"}
                    </Cell  >
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell align="center">
                       
                        <Translate>Last Name</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.lastName?"True":"False"}
                    </Cell  >
                </Column>
                <Column sortable flexGrow={3}>
                    <HeaderCell align="center">
                    
                        <Translate>Mobile Number </Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.mobileNumber?"True":"False"}
                    </Cell  >
                </Column>
                <Column sortable flexGrow={2}>
                    <HeaderCell align="center">
        
                        <Translate>Document Number </Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.documentNo?"True":"False"}
                    </Cell  >
                </Column>
                <Column sortable flexGrow={3}>
                    <HeaderCell align="center">
           
                        <Translate>Sex At Barith</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.gender?"True":"False"}
                    </Cell  >
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                    
                        <Translate>status</Translate>
                    </HeaderCell>
                    <Cell align="center">
                        {rowData => rowData.deletedAt ? 'invalid' : 'valid'}
                    </Cell>
                </Column>

            </Table>
            <Modal open={popupOpen}  overflow>
        <Modal.Title>
          <Translate>New </Translate>
        </Modal.Title>
        <Modal.Body>
          <Form >

            <MyInput
              fieldName="lastName"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
              <MyInput
              fieldLable="Date Of birthd"
              fieldName="dob"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
            <MyInput
              fieldName="documentNo"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
              <MyInput
              fieldLable="Six At birthd"
              fieldName="gender"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
               <MyInput
              fieldLable="Mobile Number"
              fieldName="mobileNumber"
              fieldType="checkbox"
              record={candidate}
              setRecord={setCandidate}
            />
           
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button appearance="ghost" onClick={() => setPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
            </Panel>
    </>)
}
export default PotintialDuplicate;