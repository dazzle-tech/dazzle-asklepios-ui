import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    Table,
    Modal,
    Stack,
    Divider
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { ApPatientEncounterOrder } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useFetchAttachmentByKeyQuery,
    useUploadMutation,
    useDeleteAttachmentMutation,
    useUpdateAttachmentDetailsMutation
  } from '@/services/attachmentService';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import AttachmentModal from "@/pages/patient/patient-profile/AttachmentUploadModal";
import {
    useGetDiagnosticsTestListQuery
} from '@/services/setupService';
import {
    useSavePatientEncounterOrderMutation,
    useGetPatientEncounterOrdersQuery,
    useRemovePatientEncounterOrderMutation
} from '@/services/encounterService';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { newApPatientEncounterOrder } from '@/types/model-types-constructor';
import { isValid } from 'date-fns';
const DiagnosticsOrder = () => {
    const patientSlice = useAppSelector(state => state.patient);
    console.log(patientSlice.patient.key)
    const dispatch = useAppDispatch();
    const [showCanceled, setShowCanceled] = useState(true);
    const [order, setOrder] = useState<ApPatientEncounterOrder>({ ...newApPatientEncounterOrder });
    const [searchKeyword, setSearchKeyword] = useState('');
    const [listTestRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [listOrderRequest, setListOrderRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: patientSlice.encounter.key
            },
            {
                fieldName: 'is_valid',
                operator: 'match',
                value: showCanceled
            }
        ]
    });
    const [selectedTest, setSelectedTest] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const { data: testsList } = useGetDiagnosticsTestListQuery(listTestRequest);
    const { data: orderList, refetch: orderRefetch } = useGetPatientEncounterOrdersQuery(listOrderRequest);
    const [localOrder, setLocalOrder] = useState({ ...newApPatientEncounterOrder });
    const [savePatientOrder, savePatientOrderMutation] = useSavePatientEncounterOrderMutation();
    const [deleteOrder, deleteOrderMutation] = useRemovePatientEncounterOrderMutation();
    const [openDetailsModel, setOpenDetailsModel] = useState(false);
    const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
    const [actionType, setActionType] = useState(null); 
    const { data: orderPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
    const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
    const { data: departmentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
    const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
    const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch ,isSuccess} =
    useFetchAttachmentLightQuery({ refKey:order?.key }, { skip: !order?.key });
    const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
    const isSelected = rowData => {
        if (rowData && order && rowData.key === order.key) {
            return 'selected-row';
        } else return '';
    };


    useEffect(() => {
        if (searchKeyword !== "") {
            setListRequest(
                {
                    ...initialListRequest,

                    filters: [
                        {
                            fieldName: 'test_name',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        }

                    ]
                }
            );
        }
    }, [searchKeyword]);

    useEffect(() => {
    console.log(showCanceled)
    setListOrderRequest({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: patientSlice.encounter.key
            },
            {
                fieldName: 'is_valid',
                operator: 'match',
                value: showCanceled
            }
        ]
    })
    }, [showCanceled]);
    useEffect(() => {
        if (isSuccess && fetchPatintAttachmentsResponce) {
          if (actionType === 'download') {
            handleDownload(fetchPatintAttachmentsResponce[0]);
          }
        }
      }, [ fetchPatintAttachmentsResponce, actionType]);
    const handleDownloadSelectedPatientAttachment = attachmentKey => {
       
        setActionType('download');
      };
      const handleDownload = attachment => {
        const byteCharacters = atob(attachment.fileContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachment.contentType });
      
        // Create a temporary  element and trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = attachment.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      };
      
    const handleSearch = value => {
        setSearchKeyword(value);
        console.log('serch' + searchKeyword);

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
    const OpenDetailsModel = () => {
        setOpenDetailsModel(true);
    }
    const CloseDetailsModel = () => {
        setOpenDetailsModel(false);
    }
    const OpenConfirmDeleteModel = () => {
        setConfirmDeleteModel(true);
    }
    const CloseConfirmDeleteModel = () => {
        setConfirmDeleteModel(false);
    }
    const handleSaveOrder = () => {
        try {
            savePatientOrder(order).unwrap();
            setOpenDetailsModel(false);
            dispatch(notify('saved  Successfully'));
            orderRefetch();
        }
        catch (error) {


            dispatch(notify('saved  fill'));
        }

    }
    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    const handleSubmit = async () => {
        console.log(selectedRows);

        try {
            await Promise.all(
                selectedRows.map(item => savePatientOrder({ ...item, statusLkey: '1804482322306061' }).unwrap())
            );

            dispatch(notify('All orders saved successfully'));

            orderRefetch();
            setSelectedRows([]);
        } catch (error) {
            console.error("Encounter save failed:", error);
            dispatch(notify('One or more saves failed'));
        }
    };
    // new Date().toISOString()
    const handleCancle = async () => {
        console.log(selectedRows);

        try {
            await Promise.all(
                selectedRows.map(item => savePatientOrder({ ...item, statusLkey: '1804447528780744', isValid: false }).unwrap())
            );

            dispatch(notify('All orders deleted successfully'));

            orderRefetch();
            setSelectedRows([]);
            CloseConfirmDeleteModel();
        } catch (error) {
            console.error("Encounter save failed:", error);
            dispatch(notify('One or more deleted failed'));
            CloseConfirmDeleteModel();
        }
    };
    const handleItemClick = (test) => {
        setSelectedTest(test);
        console.log('Selected Test:', test.key);
        try {
            savePatientOrder({
                ...localOrder,
                patientKey: patientSlice.patient.key,
                visitKey: patientSlice.encounter.key,
                testKey: selectedTest.key,
                statusLkey: "91063195286200"
            }).unwrap();
            dispatch(notify('saved  Successfully'));
            orderRefetch();
        }
        catch (error) {

            console.error("Encounter save failed:", error);
            dispatch(notify('saved  fill'));
        }
    };
    return (
        <>
            <div className='top-container'>
                <div className='form-search-container '>
                    <Form>
                        <Text>Add test</Text>
                        <InputGroup inside className='input-search'>
                            <Input
                                placeholder={'Search Test '}
                                value={searchKeyword}
                                onChange={handleSearch}
                            />
                            <InputGroup.Button>
                                <SearchIcon />
                            </InputGroup.Button>
                        </InputGroup>
                        {searchKeyword && (
                            <Dropdown.Menu className="dropdown-menuresult">
                                {testsList && testsList?.object?.map(test => (
                                    <Dropdown.Item
                                        key={test.key}
                                        eventKey={test.key}
                                        onClick={() => handleItemClick(test)}

                                    >
                                        <span style={{ marginRight: "19px" }}>{test.testName}</span>
                                        <span>{test.testTypeLvalue.lovDisplayVale}</span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        )}
                        <Checkbox
                            checked={!showCanceled}
                            onChange={() => {
                                
                                
                                setShowCanceled(!showCanceled);
                            }}
                        >
                            Show canceled test
                        </Checkbox>

                    </Form>

                </div>
                
                <div className='space-container'></div>

                <div className="buttons-sect">
                    <IconButton
                        color="violet"
                        appearance="primary"
                        onClick={handleSubmit}
                        disabled={selectedRows.length === 0}
                        icon={<CheckIcon />}
                    >
                        <Translate>Submit</Translate>
                    </IconButton>
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={OpenConfirmDeleteModel}
                        icon={<CloseOutlineIcon />}
                        disabled={selectedRows.length === 0}
                    >
                        <Translate>Cancel</Translate>
                    </IconButton>


                </div>
            </div >
            <Table
                height={400}
                sortColumn={listOrderRequest.sortBy}
                sortType={listOrderRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                    if (sortBy)
                        setListRequest({
                            ...listOrderRequest,
                            sortBy,
                            sortType
                        });
                }}
                headerHeight={80}
                rowHeight={60}
                bordered
                cellBordered

                data={orderList?.object ?? []}
                onRowClick={rowData => {
                    setOrder(rowData);
                    console.log(fetchPatintAttachmentsResponce)
                }}
                rowClassName={isSelected}
            >
                <Column flexGrow={1}>
                    <HeaderCell align="center">

                        <Translate>#</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => (
                            <Checkbox
                                key={rowData.id}
                                checked={selectedRows.includes(rowData)}
                                onChange={() => handleCheckboxChange(rowData)}
                                disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
                            />
                        )}
                    </Cell>


                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('orderType', e)} />
                        <Translate>Order Type</Translate>
                    </HeaderCell>
                    <Cell dataKey="orderTypeLkey" />
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('TestName', e)} />
                        <Translate>Test Name</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.testName
                        }

                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('InternalCode', e)} />
                        <Translate>Internal Code</Translate>
                    </HeaderCell>
                    <Cell dataKey="internalCode" />
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('statusLkey', e)} />
                        <Translate>Status</Translate>
                    </HeaderCell>
                    <Cell  >
                        {rowData => rowData.statusLvalue.lovDisplayVale}
                    </Cell>
                </Column>
                <Column flexGrow={3}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('InternationalCoding', e)} />
                        <Translate>International Coding</Translate>
                    </HeaderCell>
                    <Cell >
                        {rowData =>
                            rowData.internationalCodeOne
                        } <br />
                        {rowData =>
                            rowData.internationalCodeTwo
                        }
                        {rowData =>
                            rowData.internationalCodeOne
                        }
                        {rowData =>
                            rowData.internationalCodeThree
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('receivedLabLkey', e)} />
                        <Translate>Received Lab</Translate>
                    </HeaderCell>
                    <Cell  >
                        {rowData => rowData.receivedLabLvalue?.lovDisplayVale || ""}
                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('reasonLkey', e)} />
                        <Translate>Reason </Translate>
                    </HeaderCell>
                    <Cell >{rowData => rowData.reasonLvalue?.lovDisplayVale || ""}</Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('priorityLkey', e)} />
                        <Translate>Priority</Translate>
                    </HeaderCell>
                    <Cell >{rowData => rowData.priorityLvalue?.lovDisplayVale || ''}
                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('notes', e)} />
                        <Translate>Notes</Translate>
                    </HeaderCell>
                    <Cell dataKey="notes" />
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('Attachment', e)} />
                        <Translate>Attachment</Translate>
                    </HeaderCell>
                    <Cell dataKey="Attachment" >
                    {rowData =>
                    <Button
                    
                        appearance="link"
                        onClick={() => handleDownloadSelectedPatientAttachment(rowData.key)}
                      >
                        Download <FileDownloadIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                      </Button>}
                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('createdAt', e)} />
                        <Translate>Submit Date</Translate>
                    </HeaderCell>
                    <Cell >
                        {  rowData => new Date(rowData.createdAt).toISOString().split('T')[0]}
                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">

                        <Translate>Add details</Translate>
                    </HeaderCell>
                    <Cell  ><IconButton onClick={OpenDetailsModel} icon={<OthersIcon />} /></Cell>
                </Column>
            </Table>

            <Modal open={openDetailsModel} onClose={CloseDetailsModel} overflow>
                <Modal.Title>
                    <Translate>Add Test Details</Translate>
                </Modal.Title>
                <Modal.Body>
                    <div className='form-search-container '>
                        <div>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={true}
                                    width={150}
                                    fieldLabel="Test Type"
                                    fieldName={'orderTypeLkey'}
                                    record={order}
                                    setRecord={setOrder}
                                />

                                <MyInput
                                    column
                                    disabled={true}
                                    width={150}
                                    fieldLabel="Test Name"
                                    fieldName={'testName'}
                                    record={order}
                                    setRecord={setOrder}
                                />
                            </Form>
                        </div>
                        <div>
                            <Form layout="inline" fluid disabled={order.statusLkey !== '91063195286200'}>

                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Order Priority"
                                    selectData={orderPriorityLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'priorityLkey'}
                                    record={order}
                                    setRecord={setOrder}
                                />
                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Reason"
                                    selectData={ReasonLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'reasonLkey'}
                                    record={order}
                                    setRecord={setOrder}
                                />
                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Received Lab"
                                    selectData={departmentTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'receivedLabLkey'}
                                    record={order}
                                    setRecord={setOrder}
                                />
                            </Form>
                        </div>
                        <div>
                            <Form layout="inline" fluid disabled={order.statusLkey !== '91063195286200'}>
                                <MyInput
                                    column
                                    rows={3}
                                    width={150}

                                    fieldName={'notes'}
                                    record={order}
                                    setRecord={setOrder}
                                />
                               


                                <IconButton
                                    style={{ marginTop: "20px", paddingTop: "10px" }}
                                    color="cyan"
                                    appearance="primary"
                                    icon={<PlusIcon />}
                                    disabled={order.statusLkey !== '91063195286200'}
                                    onClick={() => setAttachmentsModalOpen(true)}
                                >
                                    <Translate>Attached File</Translate>
                                </IconButton>
                                <AttachmentModal isOpen={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} localPatient={order} attatchmentType={'ORDER_ATTACHMENT'} />


                            </Form>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" disabled={order.statusLkey !== '91063195286200'} onClick={handleSaveOrder}>
                            Save
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseDetailsModel}>
                            Cancel
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>


            <Modal open={openConfirmDeleteModel} onClose={CloseConfirmDeleteModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Confirm Delete</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                    <p>
                        <RemindOutlineIcon style={{ color: '#ffca61', marginRight: '8px', fontSize: '24px' }} />
                        <Translate style={{fontSize: '24px' }} >
                            Are you sure you want to delete this orders?
                        </Translate>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" onClick={handleCancle}>
                            Delete
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseConfirmDeleteModel}>
                            Cancel
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default DiagnosticsOrder;
