import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, Modal, Pagination, Panel, SelectPicker, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Button, ButtonToolbar, IconButton, Text } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import PageIcon from '@rsuite/icons/Page';
import TrashIcon from '@rsuite/icons/Trash';
import CheckIcon from '@rsuite/icons/Check';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { Form, Stack, Divider, Dropdown, InputGroup } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import SearchIcon from '@rsuite/icons/Search';
import { MdSave } from 'react-icons/md';
import { Tabs, Placeholder } from 'rsuite';
import ReloadIcon from '@rsuite/icons/Reload';
import {
    useGetLovValuesByCodeQuery,
    useGetLovValuesQuery,

} from '@/services/setupService';
import {
    useGetIcdListQuery,
    useGetProcedureListQuery,
    useSaveProcedureMutation,
    useGetProcedureCodingListQuery,
    useGetProcedurePriceListQuery,
    useSaveProcedureCodingMutation,
    useSaveProcedurePriceListMutation,
    useRemoveProcedureMutation,
    useRemoveProcedurePriceListMutation,
    useRemoveProcedureCodingMutation
} from '@/services/setupService';
import { ApProcedureCoding, ApProcedurePriceList, ApProcedureSetup } from '@/types/model-types';
import { newApProcedureCoding, newApProcedurePriceList, newApProcedureSetup } from '@/types/model-types-constructor';
const ProcedureSetup = () => {
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [popupOpen, setPopupOpen] = useState(false);
    const dispatch = useAppDispatch();
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [searchKeywordicd2, setSearchKeywordicd2] = useState('');
    const [isactive,setIsactive]=useState(false);
    const [contraindicationsDescription, setcontraindicationsDescription] = useState<string>('');
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
    const { data: codeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
    const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
    const { data: procedureQueryResponse, refetch: profetch } = useGetProcedureListQuery(listRequest);
    const [saveProcedure, saveProcedureMutation] = useSaveProcedureMutation();
    const [removeProcedure, removeProcedureMutation] = useRemoveProcedureMutation();
    const [removeProcedurePriceList, removeProcedurePriceListMutation] = useRemoveProcedurePriceListMutation();
    const [removeProcedureCoding, removeProcedureCodingMutation] = useRemoveProcedureCodingMutation();
    const [procedure, setProcedure] = useState<ApProcedureSetup>({ ...newApProcedureSetup });
    const [procedureCode, setProcedureCode] = useState<ApProcedureCoding>({ ...newApProcedureCoding, procedureKey: procedure.key })
   
    const [procedureprice, setProcedurePrice] = useState<ApProcedurePriceList>({ ...newApProcedurePriceList });
    const { data: procedurecodingQueryResponse, refetch: procfetch } = useGetProcedureCodingListQuery({ ...initialListRequest
        ,
        filters: [
            {
                fieldName: "procedure_key",
                operator: "",
                value: procedure.key,
            },
           
        ],
        ignore: procedure.key==undefined
     });
    const [saveProcedureCoding, saveProcedureCodingMutation] = useSaveProcedureCodingMutation();
    const { data: procedurepriceQueryResponse, refetch: propfetch } = useGetProcedurePriceListQuery({ ...initialListRequest
        ,
        filters: [
            {
                fieldName: "procedure_key",
                operator: "",
                value: procedure.key,
            },
           
        ],
        ignore: procedure.key==undefined
     });
    const [saveProcedurePrice, saveProcedurePriceMutation] = useSaveProcedurePriceListMutation();
 
    const isSelected = rowData => {
        if (rowData && procedure && rowData.key === procedure.key) {
            return 'selected-row';
        } else return '';
    };
    const isSelectedcode = rowData => {
        if (rowData && procedureCode && rowData.key === procedureCode.key) {
            return 'selected-row';
        } else return '';
    };
    const isSelectedprice = rowData => {
        if (rowData && procedureprice && rowData.key === procedureprice.key) {
            return 'selected-row';
        } else return '';
    };
    const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
    });
    const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
    const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`,
    }));
    useEffect(() => {
        if (searchKeywordicd.trim() !== "") {
            setIcdListRequest(
                {
                    ...initialListRequest,
                    filterLogic: 'or',
                    filters: [
                        {
                            fieldName: 'icd_code',
                            operator: 'containsIgnoreCase',
                            value: searchKeywordicd
                        },
                        {
                            fieldName: 'description',
                            operator: 'containsIgnoreCase',
                            value: searchKeywordicd
                        }

                    ]
                }
            );
        }
    }, [searchKeywordicd]);
    useEffect(() => {
        if (searchKeywordicd2.trim() !== "") {
            setIcdListRequest(
                {
                    ...initialListRequest,
                    filterLogic: 'or',
                    filters: [
                        {
                            fieldName: 'icd_code',
                            operator: 'containsIgnoreCase',
                            value: searchKeywordicd2
                        },
                        {
                            fieldName: 'description',
                            operator: 'containsIgnoreCase',
                            value: searchKeywordicd2
                        }

                    ]
                }
            );
        }
    }, [searchKeywordicd2]);
    useEffect(() => {
        if (procedure.indications != null || procedure.indications != "") {

            setindicationsDescription(prevadminInstructions => {
                const currentIcd = icdListResponseLoading?.object?.find(
                    item => item.key === procedure.indications
                );

                if (!currentIcd) return prevadminInstructions;

                const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

                return prevadminInstructions
                    ? `${prevadminInstructions}\n${newEntry}`
                    : newEntry;
            });
        }
    }, [procedure.indications]);
    useEffect(() => {
        if (procedure.contraindications != null || procedure.contraindications != "") {

            setcontraindicationsDescription(prevadminInstructions => {
                const currentIcd = icdListResponseLoading?.object?.find(
                    item => item.key === procedure.contraindications
                );

                if (!currentIcd) return prevadminInstructions;

                const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

                return prevadminInstructions
                    ? `${prevadminInstructions}\n${newEntry}`
                    : newEntry;
            });
        }
    }, [procedure.contraindications]);
    useEffect(() => {
        if(procedure.deletedAt!=null){
       setIsactive(true);}
       else{
        setIsactive(false);
       }
    }, [procedure])
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
        setProcedure({ ...newApProcedureSetup, categoryLkey: null });
        setProcedureCode({...newApProcedureCoding,codeTypeLkey:null});
        setProcedurePrice({...newApProcedurePriceList,currencyLkey:null});
        setcontraindicationsDescription("");
        setindicationsDescription("");
        setPopupOpen(true);
    };
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);


    };
    const handleSearchIcd2 = value => {
        setSearchKeywordicd2(value);


    };
    const handleClear = () => {
        setProcedure({ ...newApProcedureSetup, categoryLkey: null });
        setProcedureCode({...newApProcedureCoding,codeTypeLkey:null});
        setProcedurePrice({...newApProcedurePriceList,currencyLkey:null});
        setcontraindicationsDescription("");
        setindicationsDescription("");
    }
    const handleSave = async () => {
        // setPopupOpen(false);
        const response = await saveProcedure({
            ...procedure,
            indications: indicationsDescription,
            contraindications: contraindicationsDescription

        }).unwrap();
        dispatch(notify('saved  Successfully'));
        console.log(response);
        setProcedure(response);
        profetch().then(() => {
            console.warn("refetch procedure")
        });

    };
    const handleSaveCoding = () => {
        saveProcedureCoding({ ...procedureCode,
            procedureKey:procedure.key
         }).unwrap().then(() => {
            dispatch(notify('saved  Successfully'));

            procfetch().then(() => {
                console.warn("refetch procedure")
            });
        })
    }
    const handleSavePrice= () => {
        saveProcedurePrice({ ...procedureprice,
            procedureKey:procedure.key
         }).unwrap().then(() => {
            dispatch(notify('saved  Successfully'));

            propfetch().then(() => {
                console.warn("refetch procedure")
            });
        })
    }
     const joinValuesFromArray = (values) => {
            return values.filter(Boolean).join(', ');
        };
    return (<><Panel
        header={
            <h3 className="title">
                <Translate>Procedure Setup</Translate>
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

                 disabled={!procedure.key}
                appearance="primary"
                onClick={() => setPopupOpen(true)}
                color="cyan"
                icon={<EditIcon />}
            >
                Edit Selected
            </IconButton>
            {!isactive&&
            <IconButton
            disabled={!procedure.key}
            onClick={()=>{
                removeProcedure({...procedure}).unwrap().then(()=>{
                    profetch();
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
                            saveProcedure({...procedure,deletedAt:null}).unwrap().then(()=>{
                                profetch();
                            });
                            setIsactive(false);
                        }}
                        icon={<ReloadIcon/>}
                        disabled={!procedure.key}
                    >
                        <Translate> Activate</Translate>
                    </IconButton>

                }
            <IconButton
               disabled={!procedure.key}
                appearance="primary"
                color="blue"

                icon={<PageIcon />}
            >
                Linked Serviece
            </IconButton>
            <IconButton
                // disabled={!agegroups.key}
                appearance="primary"
                color="blue"

                icon={<PageIcon />}
            >
                Surgical Kits
            </IconButton>
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
            data={procedureQueryResponse?.object ?? []}
            onRowClick={rowData => {
                setProcedure(rowData);
            }}
            rowClassName={isSelected}
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

        </Table>
        <div style={{ padding: 20 }}>
            <Pagination
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['limit', '|', 'pager']}
                limitOptions={[5, 15, 30]}
                limit={listRequest.pageSize}
                activePage={listRequest.pageNumber}
                onChangePage={pageNumber => {
                    setListRequest({ ...listRequest, pageNumber });
                }}
                onChangeLimit={pageSize => {
                    setListRequest({ ...listRequest, pageSize });
                }}
                total={procedureQueryResponse?.extraNumeric ?? 0}
            />
        </div>
        <Modal size="md" open={popupOpen} overflow>
            <Modal.Title>
                <Translate>New/Edit Procedure </Translate>
            </Modal.Title>
            <Modal.Body  >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form layout="inline" fluid>
                        <MyInput
                            column

                            width={150}

                            fieldLabel="Procedure Name"
                            fieldName={'name'}
                            record={procedure}
                            setRecord={setProcedure}
                        />
                        <MyInput
                            column

                            width={150}

                            fieldLabel="Procedure Code"
                            fieldName={'code'}
                            record={procedure}
                            setRecord={setProcedure}
                        />
                        <MyInput
                            column

                            width={150}
                            fieldType="select"
                            fieldLabel="Category Type"
                            selectData={CategoryLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'categoryLkey'}
                            record={procedure}
                            setRecord={setProcedure}
                        />
                    </Form>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ margin: '3px' }}>
                            <Text style={{ fontWeight: 'bold' }}>Indications</Text>
                            <InputGroup inside style={{ width: '300px', margin: '3px' }}>
                                <Input
                                    placeholder="Search ICD-10"
                                    value={searchKeywordicd}
                                    onChange={handleSearchIcd}
                                />
                                <InputGroup.Button>
                                    <SearchIcon />
                                </InputGroup.Button>
                            </InputGroup>
                            {searchKeywordicd && (
                                <Dropdown.Menu className="dropdown-menuresult">
                                    {modifiedData?.map(mod => (
                                        <Dropdown.Item
                                            key={mod.key}
                                            eventKey={mod.key}
                                            onClick={() => {
                                                setProcedure({
                                                    ...procedure,
                                                    indications: mod.key
                                                })
                                                setSearchKeywordicd("");
                                            }}
                                        >
                                            <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                                            <span>{mod.description}</span>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            )}
                            <Input as="textarea"
                                disabled={true}
                                onChange={(e) => setindicationsDescription} value={indicationsDescription
                                    || procedure.indications
                                }
                                style={{ width: 300 }} rows={4} />
                        </div>
                        <div style={{ margin: '3px' }}>
                            <Text style={{ fontWeight: 'bold' }}>Contraindications</Text>
                            <InputGroup inside style={{ width: '300px', margin: '3px' }}>
                                <Input
                                    placeholder="Search ICD-10"
                                    value={searchKeywordicd2}
                                    onChange={handleSearchIcd2}
                                />
                                <InputGroup.Button>
                                    <SearchIcon />
                                </InputGroup.Button>
                            </InputGroup>
                            {searchKeywordicd2 && (
                                <Dropdown.Menu className="dropdown-menuresult">
                                    {modifiedData?.map(mod => (
                                        <Dropdown.Item
                                            key={mod.key}
                                            eventKey={mod.key}
                                            onClick={() => {
                                                setProcedure({
                                                    ...procedure,
                                                    contraindications: mod.key
                                                })
                                                setSearchKeywordicd2("");
                                            }}
                                        >
                                            <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                                            <span>{mod.description}</span>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            )}
                            <Input as="textarea"
                                disabled={true}
                                onChange={(e) => setcontraindicationsDescription} value={contraindicationsDescription
                                    || procedure.contraindications
                                }
                                style={{ width: 300 }} rows={4} />
                        </div>
                    </div>
                    <Form layout="inline" fluid>
                        <MyInput
                            column
                            width={300}
                            fieldType="textarea"
                            fieldName={'preparationInstructions'}
                            record={procedure}
                            setRecord={setProcedure}
                        />
                        <MyInput
                            column

                            width={300}
                            fieldType="textarea"

                            fieldName={'recoveryNotes'}
                            record={procedure}
                            setRecord={setProcedure}
                        />
                    </Form>
                    <ButtonToolbar>
                        <IconButton
                            color="violet"
                            appearance="primary"
                            onClick={handleSave}


                            icon={<CheckIcon />}
                        >
                            <Translate>Save</Translate>
                        </IconButton>
                        <Button
                            color="cyan"
                            appearance="primary"
                            style={{ marginLeft: "5px" }}
                            onClick={handleClear}

                        >

                            <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px' }} />
                            <span>Clear</span>
                        </Button>

                    </ButtonToolbar>

                    <Tabs defaultActiveKey="1" appearance="subtle">
                        <Tabs.Tab eventKey="1" title="Coding">
                            <div style={{ display: 'flex', flexDirection: 'column', zoom: 0.83 }}>
                                <Panel style={{ display: 'flex' }} >
                                    <Form layout="inline" fluid style={{ display: 'flex' }} >
                                        <MyInput
                                            column
                                            width={150}
                                            fieldType="select"
                                            fieldLabel="Code Type"
                                            selectData={codeTypeLovQueryResponse?.object ?? []}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'codeTypeLkey'}
                                            record={procedureCode}
                                            setRecord={setProcedureCode}
                                        />
                                        <MyInput
                                            column
                                            width={150}
                                            fieldType="select"
                                            fieldLabel="Code"
                                            selectData={[]}
                                            selectDataLabel="name"
                                            selectDataValue="key"
                                            fieldName={'internationalCodeKey'}
                                            record={procedureCode}
                                            setRecord={setProcedureCode}
                                        />
                                        <ButtonToolbar zoom={.8} style={{ padding: '6px', display: 'flex', marginTop: '20px' }}>
                                            <IconButton
                                                size="xs"
                                                onClick={handleSaveCoding}
                                                appearance="primary"
                                                color="violet"
                                                icon={<MdSave />}
                                            >

                                            </IconButton>

                                            <IconButton
                                                size="xs"
                                                appearance="primary"
                                                color="blue"
                                                onClick={()=>{
                                                  console.log(procedureCode)
                                                    removeProcedureCoding({...procedureCode}).unwrap().then(()=>{
                                                        procfetch();
                                                        dispatch(notify("deleted succsessfuly"))
                                                    });
                                                    
                                                }}
                                                icon={<TrashIcon />}
                                            >

                                            </IconButton>



                                        </ButtonToolbar>
                                    </Form>
                                </Panel>
                                <div>
                                <Table
                                    height={200}
                                   
                                    onSortColumn={(sortBy, sortType) => {
                                        if (sortBy)
                                            setListRequest({
                                                ...listRequest,
                                                sortBy,
                                                sortType
                                            });
                                    }}
                                    headerHeight={33}
                                    rowHeight={40}

                                    data={procedurecodingQueryResponse?.object ?? []}
                                    onRowClick={rowData => {
                                         setProcedureCode(rowData);
                                    }}
                                    rowClassName={isSelectedcode}
                                >
                                    <Column sortable flexGrow={1}>
                                        <HeaderCell align="center">

                                            <Translate>Code Type</Translate>
                                        </HeaderCell>
                                        <Cell align="center">
                                            {rowData => rowData.codeTypeLkey?rowData.codeTypeLvalue.lovDisplayVale:rowData.codeTypeLkey}
                                        </Cell  >
                                    </Column>
                                    <Column sortable flexGrow={2}>
                                        <HeaderCell align="center">

                                            <Translate>international Code</Translate>
                                        </HeaderCell>
                                        <Cell align="center">
                                            {rowData => rowData.internationalCodeKey}
                                        </Cell  >
                                    </Column>


                                </Table>
                                </div>
                            </div>
                        </Tabs.Tab>
                        <Tabs.Tab eventKey="2" title="Price list">
                        <div style={{ display: 'flex', flexDirection: 'column', zoom: 0.83 }}>
                                <Panel style={{ display: 'flex' }} >
                                    <Form layout="inline" fluid style={{ display: 'flex' }} >
                                        <MyInput
                                            column
                                            width={150}
                                            fieldType="number"                 
                                            fieldName={'price'}
                                            record={procedureprice}
                                            setRecord={setProcedurePrice}
                                        />
                                        <MyInput
                                            column
                                            width={150}
                                            fieldType="select"
                                            fieldLabel="Currency"
                                            selectData={currencyLovQueryResponse?.object??[]}
                                            selectDataLabel="lovDisplayVale"
                                            selectDataValue="key"
                                            fieldName={'currencyLkey'}
                                            record={procedureprice}
                                            setRecord={setProcedurePrice}
                                        />
                                        <MyInput
                                            column
                                            width={150}
                                            fieldType="select"
                                            fieldLabel=" Choose Price List"
                                            selectData={[]}
                                            selectDataLabel="name"
                                            selectDataValue="key"
                                            fieldName={'internationalCodeKey'}
                                            record={procedureprice}
                                            setRecord={setProcedurePrice}
                                        />
                                        <ButtonToolbar zoom={.8} style={{ padding: '6px', display: 'flex', marginTop: '20px' }}>
                                            <IconButton
                                                size="xs"
                                                onClick={handleSavePrice}
                                                appearance="primary"
                                                color="violet"
                                                icon={<MdSave />}
                                            >

                                            </IconButton>

                                            <IconButton
                                                size="xs"
                                                appearance="primary"
                                                onClick={()=>{
                                               
                                                    removeProcedurePriceList({...procedureprice}).unwrap().then(()=>{
                                                        propfetch();
                                                        dispatch(notify("deleted succsessfuly"))
                                                    });
                                                    
                                                }}
                                                color="blue"
                                                icon={<TrashIcon />}
                                            >
                                            </IconButton>



                                        </ButtonToolbar>
                                    </Form>
                                </Panel>
                                <div>
                                <Table
                                    height={200}
                                   
                                  
                                    headerHeight={33}
                                    rowHeight={40}

                                    data={procedurepriceQueryResponse?.object ?? []}
                                    onRowClick={rowData => {
                                         setProcedurePrice(rowData);
                                    }}
                                    rowClassName={isSelectedprice}
                                >
                                    <Column sortable flexGrow={1}>
                                        <HeaderCell align="center">

                                            <Translate>Price,Currency</Translate>
                                        </HeaderCell>
                                        <Cell align="center">
                                            {rowData =>joinValuesFromArray([rowData.price,rowData.currencyLvalue?.lovDisplayVale])}
                                        </Cell  >
                                    </Column>
                                    <Column sortable flexGrow={2}>
                                        <HeaderCell align="center">

                                            <Translate>Price List Name</Translate>
                                        </HeaderCell>
                                        <Cell align="center">
                                            {rowData => rowData.priceListKey}
                                        </Cell  >
                                    </Column>


                                </Table>
                                </div>
                            </div>
                        </Tabs.Tab>

                    </Tabs>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Stack spacing={2} divider={<Divider vertical />}>
                   
                    <Button appearance="ghost" onClick={() => setPopupOpen(false)}>
                        Close
                    </Button>
                </Stack>
            </Modal.Footer>
        </Modal>
    </Panel></>)
}
export default ProcedureSetup;