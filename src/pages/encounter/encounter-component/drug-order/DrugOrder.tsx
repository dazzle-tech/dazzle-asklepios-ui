import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import PageIcon from '@rsuite/icons/Page';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import DocPassIcon from '@rsuite/icons/DocPass';
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
    Divider,
    Radio,
    RadioGroup,
    TagInput,
    TagGroup,
    SelectPicker,
    Tag,
    DatePicker,



} from 'rsuite';
import { List } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { useGetGenericMedicationActiveIngredientQuery, useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import BlockIcon from '@rsuite/icons/Block';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import {
    useGetGenericMedicationQuery,
    useGetGenericMedicationWithActiveIngredientQuery,
    useGetLinkedBrandQuery
} from '@/services/medicationsSetupService';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useGetDrugOrderQuery,
    useSaveDrugOrderMutation,
    useGetDrugOrderMedicationQuery,
    useSaveDrugOrderMedicationMutation,

} from '@/services/encounterService';
import {
    useGetAllergiesQuery
} from '@/services/observationService';
import {
    useGetDepartmentsQuery,

} from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { ApDrugOrderMedications } from '@/types/model-types';
import { newApDrugOrder, newApDrugOrderMedications } from '@/types/model-types-constructor';
import { filter } from 'lodash';
import {
    useGetIcdListQuery,
} from '@/services/setupService';
import './styles.less';
const DrugOrder = () => {
    const patientSlice = useAppSelector(state => state.patient);
    const dispatch = useAppDispatch();
    const [drugKey, setDrugKey] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [searchKeywordSnomed, setSearchKeywordSnomed] = useState('');
    const [searchActive, setSearchActive] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const [tags, setTags] = React.useState([]);
    const [showCanceled, setShowCanceled] = useState(true);
    const [editing, setEditing] = useState(false);
    const [typing, setTyping] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [filteredList, setFilteredList] = useState([]);
    const [isdraft, setIsDraft] = useState(false);
    const [selectedFirstDate, setSelectedFirstDate] = useState(null);
    const [editDuration, setEditDuration] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [adminInstructions, setAdminInstructions] = useState("");
    const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
    const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
    const [edit_new, setEdit_new] = useState(true);
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [listGenericRequest, setListGenericRequest] = useState<ListRequest>({ ...initialListRequest });
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
    const { data: orderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MEDCATION_ORDER_TYPE');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
    const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
    const { data: priorityLevelLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
    const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ORDER_ADMIN_NSTRUCTIONS');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patientSlice.patient.key
            },
            ,
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }

        ]
    });
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true
    });
    const { data: orders, refetch: ordRefetch } = useGetDrugOrderQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patientSlice.patient.key,
            },
            {
                fieldName: "visit_key",
                operator: "match",
                value: patientSlice.encounter.key,
            }

        ],
    });
    const { data: departmentListResponse } = useGetDepartmentsQuery({
        ...initialListRequest
        ,
        filters: [

            {
                fieldName: "department_type_lkey",
                operator: "match",
                value: '5673990729647012',
            },


        ]
    });
    const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery({ ...initialListRequest });
    const [listGinricRequest, setListGinricRequest] = useState({
        ...initialListRequest,



        sortType: 'desc'
        ,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            ,
            {
                fieldName: 'generic_medication_key',
                operator: 'match',
                value: selectedGeneric?.key

            }
        ]
    });
    const [orderMedication, setOrderMedication] = useState<ApDrugOrderMedications>(
        {
            ...newApDrugOrderMedications,
            drugOrderKey: drugKey,


        });
    const [saveDrugorder, saveDrugorderMutation] = useSaveDrugOrderMutation();
    const [saveDrugorderMedication, saveDrugorderMedicationMutation] = useSaveDrugOrderMedicationMutation();
    const { data: genericMedicationActiveIngredientListResponseData, refetch: refetchGenric } = useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });
    const { data: ActiveIngredientListResponseData, refetch: refetchGen } = useGetGenericMedicationActiveIngredientQuery({ ...initialListRequest });
    const { data: orderMedications, refetch: medicRefetch } = useGetDrugOrderMedicationQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "drug_order_key",
                operator: "",
                value: drugKey,
            },
            {
                fieldName: "status_lkey",
                operator: showCanceled ? "notMatch" : "match",
                value: "1804447528780744",
            }
        ],
    });
    const { data: lisOfLinkedBrand } = useGetLinkedBrandQuery(selectedGeneric?.key, { skip: selectedGeneric?.key == null });
    const filteredorders = orders?.object?.filter(
        (item) => item.statusLkey === "1804482322306061"
    ) ?? [];
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
    const isSelected = rowData => {
        if (rowData && orderMedication && rowData.key === orderMedication.key) {
            return 'selected-row';
        } else return '';
    };
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setListGenericRequest({
                ...listGenericRequest,
                filters: [
                    {
                        fieldName: "generic_name",
                        operator: "containsIgnoreCase",
                        value: searchKeyword,
                    },
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    }
                ],
            });
        }
    }, [searchKeyword]);

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

        const updatedFilters = [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            ,

            {
                fieldName: 'generic_medication_key',
                operator: 'match',
                value: selectedGeneric?.key || null
            }
        ];
        console.log(updatedFilters);
        setListGinricRequest((prevRequest) => ({

            ...prevRequest,
            filters: updatedFilters,

        }));
    }, [selectedGeneric]);

    useEffect(() => {
        refetchGenric().then(() => {

        })
    }, [listGinricRequest]);
    useEffect(() => {
        if (orderMedication.administrationInstructions != null) {

            console.log(orderMedication.administrationInstructions)
            setAdminInstructions(prevadminInstructions =>
                prevadminInstructions ? `${prevadminInstructions}, ${administrationInstructionsLovQueryResponse?.object?.find(
                    item => item.key === orderMedication.administrationInstructions
                )?.lovDisplayVale}` :
                    administrationInstructionsLovQueryResponse?.object?.find(
                        item => item.key === orderMedication.administrationInstructions
                    )?.lovDisplayVale
            );
        }

        setOrderMedication({ ...orderMedication, administrationInstructions: null })
    }, [orderMedication.administrationInstructions])
    useEffect(() => {
        console.log("ischronic", orderMedication.chronicMedication);
        setEditDuration(orderMedication.chronicMedication);
        setOrderMedication({ ...orderMedication, duration: null, durationTypeLkey: null })
    }, [orderMedication.chronicMedication]);
    useEffect(() => {
        if (orders?.object) {
            const foundOrder = orders.object.find(order => {

                return order.saveDraft === true;
            });

            if (foundOrder?.key != null) {
                setDrugKey(foundOrder?.key);
            
            }

        }

    }, [orders]);
    useEffect(() => {
        console.log(drugKey)
        if (drugKey == null) {
            handleCleare();
        }

    }, [drugKey]);
    useEffect(() => {

        const foundOrder = orders?.object?.find(order => order.key === drugKey);
        if (foundOrder?.saveDraft !== isdraft) {
            setIsDraft(foundOrder?.saveDraft);
        }

    }, [orders, drugKey]);
    useEffect(() => {
        if (indicationsIcd.indicationIcd != null || indicationsIcd.indicationIcd != "") {

            setindicationsDescription(prevadminInstructions => {
                const currentIcd = icdListResponseLoading?.object?.find(
                    item => item.key === indicationsIcd.indicationIcd
                );

                if (!currentIcd) return prevadminInstructions;

                const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

                return prevadminInstructions
                    ? `${prevadminInstructions}\n${newEntry}`
                    : newEntry;
            });
        }
    }, [indicationsIcd.indicationIcd]);
    const handleItemClick = (Generic) => {
        setSelectedGeneric(Generic);
        refetchGenric().then(() => {
            console.log("Refetch Genric");



        }).catch((error) => {
            console.error("Refetch failed:", error);
        });
        setSearchKeyword("")
        const newList = roaLovQueryResponse.object.filter((item) =>
            (Generic.roaList).includes(item.key)
        );
        setFilteredList(newList);

    };
    const saveDraft = async () => {
        try {
            await saveDrugorder({
                ...orders?.object?.find(order =>
                    order.key === drugKey
                ),
                saveDraft: true
            }).then(() => {
                dispatch(notify('Saved Draft successfully'));
                setIsDraft(true);
            })
        } catch (error) { }

    }
    const cancleDraft = async () => {
        try {
            await saveDrugorder({
                ...orders?.object?.find(order =>
                    order.key === drugKey
                ),
                saveDraft: false
            }).then(() => {
                dispatch(notify(' Draft Canceld'));
                setIsDraft(false);
            })
        } catch (error) { }

    }
    const handleDateChange = (date) => {
        if (date) {
            const timestamp = date.getTime();

            setSelectedFirstDate(date);


        }
    };
    const handleSearch = value => {
        setSearchKeyword(value);


    };
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);


    };

    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    const addTag = () => {
        const nextTags = inputValue ? [...tags, inputValue] : tags;
        setTags(nextTags);
        setTyping(false);
        setInputValue('');
    };

    const handleButtonClick = () => {
        setTyping(true);
    };
    const removeTag = tag => {
        const nextTags = tags.filter(item => item !== tag);
        setTags(nextTags);
    };
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };

    const renderInput = () => {
        if (typing) {
            return (
                <Input
                    className="tag-input"
                    size="xs"
                    style={{ width: 70 }}
                    value={inputValue}
                    onChange={setInputValue}
                    onBlur={addTag}
                    onPressEnter={addTag}
                />
            );
        }

        return (
            <IconButton
                className="tag-add-btn"
                onClick={handleButtonClick}
                icon={<PlusIcon />}
                appearance="ghost"
                size="xs"
            />
        );
    };
    const handleSaveOrder = async () => {


        if (patientSlice.patient && patientSlice.encounter) {
            try {

                const response = await saveDrugorder({
                    ...newApDrugOrder,
                    patientKey: patientSlice.patient.key,
                    visitKey: patientSlice.encounter.key,
                    statusLkey: "164797574082125",
                });


                dispatch(notify('Start New Order whith ID:' + response?.data?.drugorderId));

                setDrugKey(response?.data?.key);

                ordRefetch().then(() => {
                    console.log("Refetch complete pres");
                    console.log(orders?.object);
                    console.log(drugKey);
                }).catch((error) => {
                    console.error("Refetch failed:", error);
                });

            } catch (error) {
                console.error("Error saving order:", error);
            }
        } else {
            dispatch(notify("Patient or encounter is missing. Cannot save order."));
        }
    };
    const handleCancle = async () => {


        try {
            await
                saveDrugorderMedication({ ...orderMedication, statusLkey: "1804447528780744", deletedAt: Date.now() }).unwrap();


            dispatch(notify(' medication deleted successfully'));
            CloseCancellationReasonModel();
            medicRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

        } catch (error) {

            dispatch(notify(' deleted failed'));

        }
    };
    const handleSubmitPres = async () => {
        try {
            await saveDrugorder({
                ...orders?.object?.find(order =>
                    order.key === drugKey
                ),

                statusLkey: "1804482322306061"
                , saveDraft: false,
                submittedAt: Date.now()
            }).unwrap();
            dispatch(notify('submetid  Successfully'));
            handleCleare();
            ordRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });
            medicRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

        }
        catch (error) {
            console.error("Error saving order or medications:", error);
        }

        orderMedications?.object?.map((item) => {
            saveDrugorderMedication({ ...item, statusLkey: "1804482322306061" })
        })
        medicRefetch().then(() => {
            console.log("Refetch complete");
        }).catch((error) => {
            console.error("Refetch failed:", error);
        });



    }

    const handleSaveMedication = () => {
        console.log(indicationsDescription);
        try {
            const tagcompine = joinValuesFromArray(tags);
            saveDrugorderMedication({
                ...orderMedication,
                patientKey: patientSlice.patient.key,
                visitKey: patientSlice.encounter.key,
                drugOrderKey: drugKey,
                genericMedicationsKey: selectedGeneric.key,
                parametersToMonitor: tagcompine,
                statusLkey: "164797574082125",
                startDateTime: selectedFirstDate ? selectedFirstDate.getTime() : null,
                indicationIcd: indicationsDescription,
                administrationInstructions: adminInstructions
            }).unwrap().then(() => {
                dispatch(notify("added sucssesfily"));
                handleCleare();
                medicRefetch();
            })
        } catch (error) {
            dispatch(notify("added feild"))
        }






    }

    const handleCleare = () => {
        setOrderMedication({
            ...newApDrugOrderMedications,
            durationTypeLkey: null,
            administrationInstructions: null,
            startDateTime: null,
            genericSubstitute: false,
            chronicMedication: false,
            patientOwnMedication: false,
            priorityLkey: null,
            roaLkey: null,
            doseUnitLkey: null,
            drugOrderTypeLkey: null,
            indicationUseLkey: null,
            pharmacyDepartmentKey: null,


        })
        setAdminInstructions("");
        setSelectedGeneric(null);
        setSelectedFirstDate(null);
        setindicationsDescription("");


        setTags([])
    }
    const OpenCancellationReasonModel = () => {
        setOpenCancellationReasonModel(true);
    }
    const CloseCancellationReasonModel = () => {
        setOpenCancellationReasonModel(false);
    }
    const CloseSubstitutesModel = () => {
        setOpenSubstitutesModel(false);
    }
    const renderRowExpanded = rowData => {
        // Add this line to check children data

        return (


            <Table
                data={[rowData]} // Pass the data as an array to populate the table
                bordered
                cellBordered
                style={{ width: '100%', marginTop: '10px' }}
                height={100} // Adjust height as needed
            >
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell dataKey="createdAt" >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell dataKey="createdBy" />
                </Column>

                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelled At</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelled By</HeaderCell>
                    <Cell dataKey="deletedBy" />
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell dataKey="cancellationReason" />
                </Column>
            </Table>


        );
    };

    const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];

        expandedRowKeys.forEach(key => {
            if (key === rowData.key) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });

        if (!open) {
            nextExpandedRowKeys.push(rowData.key);
        }



        console.log(nextExpandedRowKeys)
        setExpandedRowKeys(nextExpandedRowKeys);
    };

    const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
            <IconButton
                appearance="subtle"
                onClick={() => {
                    onChange(rowData);
                }}
                icon={
                    expandedRowKeys.some(key => key === rowData["key"]) ? (
                        <CollaspedOutlineIcon />
                    ) : (
                        <ExpandOutlineIcon />
                    )
                }
            />
        </Cell>
    );

    return (<><h5 style={{ marginTop: "10px" }}>Drug Order</h5>
        <div className='top-container-p'>
            <div style={{ width: '500px' }}>
                <SelectPicker

                    style={{ width: '100%' }}
                    data={filteredorders ?? []}
                    labelKey="drugorderId"
                    valueKey="key"
                    placeholder="orders"
                    //   value={selectedDiagnose.diagnoseCode}
                    onChange={e => {
                        setDrugKey(e);

                    }}

                />
            </div>
            <div>
                <Text>Current Order ID : {orders?.object?.find(order =>
                    order.key === drugKey
                )?.drugorderId}</Text>
            </div>
            {!isMinimized && <div className="custom-fab">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', marginTop: '12px', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={{
                            fontWeight: 'bold',
                            marginBottom: '10px',
                            fontFamily: "'Times New Roman', serif"
                        }}>
                            Patient's Allergies
                        </Text>

                        <div style={{ marginLeft: 'auto', display: 'flex' }}>
                            <button onClick={() => setIsMinimized(true)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                    fontSize: '18px'
                                }}>
                                -
                            </button>
                            <button onClick={() => setIsMinimized(false)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                    marginLeft: '2px',
                                    fontSize: '18px'
                                }}>
                                +
                            </button>
                        </div>
                    </div>

                    <List style={{ height: '190px', width: '250px', overflow: 'auto' }}>
                        {allergiesListResponse?.object?.map((order, index) => (
                            <List.Item key={index}>
                                {order.allergyTypeLvalue?.lovDisplayVale}, {order.severityLvalue.lovDisplayVale},{order.allergensName}
                            </List.Item>
                        ))}
                    </List>
                </div>
            </div>}
            {isMinimized &&
                <div className="custom-fab" style={{ height: '60px' }}>
                    <div style={{ display: 'flex', marginTop: '12px', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={{
                            fontWeight: 'bold',
                            marginBottom: '10px',
                            fontFamily: "'Times New Roman', serif"
                        }}>
                            Patient's Allergies
                        </Text>

                        <div style={{ marginLeft: 'auto', display: 'flex' }}>
                            <button onClick={() => setIsMinimized(true)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                    fontSize: '18px'
                                }}>
                                -
                            </button>
                            <button onClick={() => setIsMinimized(false)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                    marginLeft: '2px',
                                    fontSize: '18px'
                                }}>
                                +
                            </button>
                        </div>
                    </div>

                </div>}


            <IconButton
                color="cyan"
                appearance="ghost"
                onClick={handleSaveOrder}
                disabled={isdraft}
                style={{ marginLeft: 'auto' }}
                icon={<PlusIcon />}
            >
                <Translate>New Order</Translate>
            </IconButton>





        </div>
        <br />
        <div className='top-container-p'>
            <div className='form-search-container-p '>
                <Form disabled={drugKey != null ? editing : true}>
                    <Text>Medication Name</Text>
                    <InputGroup inside className='input-search-p'>
                        <Input
                            disabled={drugKey != null ? editing : true}
                            placeholder={'Search'}
                            value={searchKeyword}
                            onChange={handleSearch}
                        />
                        <InputGroup.Button>
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                    {searchKeyword && (
                        <Dropdown.Menu className="dropdown-menuresult">
                            {genericMedicationListResponse && genericMedicationListResponse?.object?.map(Generic => (
                                <Dropdown.Item
                                    key={Generic.key}
                                    eventKey={Generic.key}
                                    onClick={() => handleItemClick(Generic)}

                                >
                                    <span style={{ marginRight: "15px" }}>
                                        {[Generic.genericName,
                                        Generic.dosageFormLvalue?.lovDisplayVale,
                                        Generic.manufacturerLvalue?.lovDisplayVale,
                                        Generic.roaLvalue?.lovDisplayVale]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </span>
                                    {Generic.activeIngredients}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    )}



                </Form>

            </div>

            <Button
                color="cyan"
                appearance="primary"
                style={{ height: '30px', marginTop: '23px' }}
                onClick={() => {
                    setOpenSubstitutesModel(true);
                }}

            >

                <FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: '5px' }} />
                <span>Substitutes</span>
            </Button>

            {selectedGeneric && <span style={{ marginTop: "25px", fontWeight: "bold" }}>
                {[selectedGeneric.genericName,
                selectedGeneric.dosageFormLvalue?.lovDisplayVale,
                selectedGeneric.manufacturerLvalue?.lovDisplayVale,
                selectedGeneric.roaLvalue?.lovDisplayVale]
                    .filter(Boolean)
                    .join(', ')}
            </span>}
            <div className="buttons-sect-p">
                {
                    !isdraft &&
                    <IconButton
                        color="cyan"
                        appearance="primary"
                        onClick={saveDraft}
                        icon={<DocPassIcon />}
                        disabled={ drugKey?
                            orders?.object?.find(order =>
                                order.key === drugKey
                            )?.statusLkey === '1804482322306061':true
                        }
                    >
                        <Translate> Save draft</Translate>
                    </IconButton>

                }
                {
                    isdraft &&
                    <IconButton
                        color="red"
                        appearance="primary"
                        onClick={cancleDraft}
                        icon={<DocPassIcon />}
                        disabled={ drugKey?
                            orders?.object?.find(order =>
                                order.key === drugKey
                            )?.statusLkey === '1804482322306061':true
                        }
                    >
                        <Translate> Cancle draft</Translate>
                    </IconButton>

                }
                <IconButton
                    color="violet"
                    appearance="primary"
                    onClick={handleSubmitPres}

                    disabled={ drugKey?
                        orders?.object?.find(order =>
                            order.key === drugKey
                        )?.statusLkey === '1804482322306061':true
                    }

                    icon={<CheckIcon />}
                >
                    <Translate>Submit Order</Translate>
                </IconButton>




            </div>
        </div>
        <br />
        <div className='top-container-p'>
            <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid
                disabled={drugKey != null ? editing : true}

            >
                <MyInput
                    column

                    width={150}

                    fieldType="select"
                    fieldLabel="Drug Order Type"
                    selectData={orderTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'drugOrderTypeLkey'}
                    record={orderMedication}
                    setRecord={setOrderMedication}
                />
                <MyInput
                    disabled={orderMedication.drugOrderTypeLkey != '2937712448460454' ? true : false}
                    column
                    fieldLabel="PRN Indication"
                    width={150}
                    fieldName={'prnIndication'}
                    record={orderMedication}
                    setRecord={setOrderMedication}
                />
                <div>
                    <Text style={{ marginTop: '6px', fontWeight: 'bold' }}>Start Date Time</Text>
                    <DatePicker
                        format="MM/dd/yyyy hh:mm aa"
                        showMeridian
                        value={selectedFirstDate}
                        onChange={handleDateChange}
                        disabled={drugKey != null ? editing : true}
                    />
                </div>

                <MyInput
                    column
                    disabled={drugKey != null ? editing : true}
                    width={160}
                    fieldType="select"
                    fieldLabel="Send To Pharmacy"
                    selectData={departmentListResponse?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    fieldName={'pharmacyDepartmentKey'}
                    record={orderMedication}
                    setRecord={setOrderMedication}

                />



            </Form>
        </div>
        <br />
        <div className='instructions-container-p '>
            <div className='instructions-container-p ' style={{ minWidth: "800px", border: " 1px solid #b6b7b8" }}>
                <div style={{ marginLeft: "10px", display: 'flex', flexDirection: 'column' }}>
                    <div className='form-search-container-p ' style={{ width: "710px" }}>
                        <Form style={{ zoom: 0.85, display: 'flex' }} layout="inline" fluid disabled={drugKey != null ? editing : true}>
                            <MyInput
                                column
                                width={150}
                                fieldType='number'
                                fieldName={'dose'}
                                record={orderMedication}
                                setRecord={setOrderMedication}
                            />

                            <MyInput
                                column
                                width={150}
                                fieldType="select"
                                fieldLabel="Unit"
                                selectData={unitLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'doseUnitLkey'}
                                record={orderMedication}
                                setRecord={setOrderMedication}
                            />

                            <div>
                                <Text style={{ fontWeight: 'bold', marginTop: '7px' }}>Frequency</Text>
                                <InputGroup style={{ width: '160px', zoom: 0.85, height: '40px' }}>
                                    <Input
                                        disabled={orderMedication.drugOrderTypeLkey == '2937757567806213' ? true : false}

                                        style={{ width: '100px', height: '100%' }}
                                        type="number"
                                        value={orderMedication.frequency}
                                        onChange={e =>
                                            setOrderMedication({
                                                ...orderMedication,
                                                frequency: Number(e)
                                            })} />
                                    <InputGroup.Addon>
                                        <Text>Hr</Text>
                                    </InputGroup.Addon>
                                </InputGroup>
                            </div>

                            <MyInput
                                column

                                width={150}
                                fieldType="select"
                                fieldLabel="ROA"
                                selectData={filteredList ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'roaLkey'}
                                record={orderMedication}
                                setRecord={setOrderMedication}
                            />
                            <IconButton
                                color="cyan"
                                appearance="primary"
                                style={{ height: '35px', width: '170px', marginTop: '25px' }}
                                icon={<PlusIcon />}
                            >
                                <Translate>Create Titration Plan</Translate>
                            </IconButton>
                        </Form>

                    </div>
                    <Divider style={{ fontWeight: 'bold' }}>Indication</Divider>
                    <div style={{ border: '2px solid #b6b7b8"', padding: '5px', display: 'flex', gap: '5px' }}>



                        <div style={{ marginBottom: '3px', zoom: 0.85 }}>
                            <InputGroup inside style={{ width: '300px', marginTop: '28px' }}>
                                <Input
                                    disabled={drugKey != null ? editing : true}
                                    placeholder="Search ICD-10"
                                    value={searchKeywordicd}
                                    onChange={handleSearchIcd}
                                />
                                <InputGroup.Button>
                                    <SearchIcon />
                                </InputGroup.Button>
                            </InputGroup>
                            {searchKeywordicd && (
                                <Dropdown.Menu disabled={!edit_new} className="dropdown-menuresult">
                                    {modifiedData?.map(mod => (
                                        <Dropdown.Item
                                            key={mod.key}
                                            eventKey={mod.key}
                                            onClick={() => {
                                                setIndicationsIcd({
                                                    ...indicationsIcd,
                                                    indicationIcd: mod.key
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
                                    || orderMedication.indicationIcd
                                }
                                style={{ width: 300 }} rows={4} />
                        </div>
                        <div style={{ marginBottom: '3px', zoom: 0.85 }}>
                            <InputGroup inside style={{ width: '300px', marginTop: '28px' }}>
                                <Input
                                    disabled={drugKey != null ? editing : true}
                                    placeholder="Search SNOMED-CT"
                                    value={""}

                                />
                                <InputGroup.Button>
                                    <SearchIcon />
                                </InputGroup.Button>
                            </InputGroup>

                            <Input as="textarea"
                                disabled={true}

                                style={{ width: 300 }} rows={4} />
                        </div>
                        <div style={{ marginBottom: '3px', zoom: 0.85 }}>
                            <Form layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={drugKey != null ? editing : true}
                                    width={200}

                                    fieldType="select"
                                    fieldLabel="Indication Use"
                                    selectData={indicationLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'indicationUseLkey'}
                                    record={orderMedication}
                                    setRecord={setOrderMedication}

                                />
                            </Form>
                            <Input
                                as="textarea"
                                placeholder="Write Indication Manually"
                                disabled={drugKey != null ? editing : true}
                                value={orderMedication.indicationManually}
                                onChange={(e) => {
                                    console.log(e);
                                    setOrderMedication({ ...orderMedication, indicationManually: e });
                                }}
                                style={{ width: 200 }}
                                rows={4}
                            />

                        </div>

                    </div>
                </div>



            </div>
            <div className='form-search-container-p ' style={{ minWidth: "620px" }}>
                <Table
                    bordered
                    onRowClick={rowData => console.log("Row clicked:", rowData)}
                    data={genericMedicationActiveIngredientListResponseData?.object || []}
                    height={300}
                >
                    <Table.Column flexGrow={2} fullText>
                        <Table.HeaderCell style={{ fontSize: '14px' }}>Active Ingredient</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => {
                                if (!rowData) return " ";
                                const nameg = activeIngredientListResponseData?.object?.find(item => item.key === rowData.activeIngredientKey)?.name || " ";
                                return nameg;
                            }}
                        </Table.Cell>
                    </Table.Column>

                    <Table.Column flexGrow={2} fullText>
                        <Table.HeaderCell style={{ fontSize: '14px' }}>Active Ingredient ATC Code</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => {
                                if (!rowData) return " ";
                                const atcg = activeIngredientListResponseData?.object?.find(item => item.key === rowData.activeIngredientKey)?.atcCode || " ";
                                return atcg;
                            }}
                        </Table.Cell>
                    </Table.Column>

                    <Table.Column flexGrow={1} fullText>
                        <Table.HeaderCell style={{ fontSize: '14px' }}>Strength</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => rowData?.strength+rowData?.unitLvalue?.lovDisplayVale }
                        </Table.Cell>
                    </Table.Column>

                    <Table.Column flexGrow={1} fullText>
                        <Table.HeaderCell style={{ fontSize: '14px' }}>IsControlled</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => {
                                if (!rowData) return " ";
                                const isControlled = activeIngredientListResponseData?.object?.find(item => item.key === rowData.activeIngredientKey)?.isControlled;
                                return isControlled ? "Yes" : "No";
                            }}
                        </Table.Cell>
                    </Table.Column>

                    <Table.Column flexGrow={2} fullText>
                        <Table.HeaderCell style={{ fontSize: '14px' }}>Controlled</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => {
                                if (!rowData) return " ";
                                const controlledValue = activeIngredientListResponseData?.object?.find(item => item.key === rowData.activeIngredientKey)?.controlledLvalue?.lovDisplayVale || " ";
                                return controlledValue;
                            }}
                        </Table.Cell>
                    </Table.Column>

                    <Table.Column flexGrow={1} fullText>
                        <Table.HeaderCell style={{ fontSize: '14px' }}>Details</Table.HeaderCell>
                        <Table.Cell>
                            <IconButton icon={<OthersIcon />} />
                        </Table.Cell>
                    </Table.Column>
                </Table>

            </div>
        </div>
        <br />
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #b6b7b8' }}>

            <div style={{ display: 'flex', gap: '10px', padding: '4px' }}>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>


                    <MyInput
                        column
                        disabled={drugKey != null ? (!editing ? editDuration : editing) : true}
                        width={150}
                        fieldType="number"
                        fieldLabel="Duration"
                        fieldName={'duration'}
                        placholder={' '}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                    />

                    <MyInput
                        column
                        disabled={drugKey != null ? (!editing ? editDuration : editing) : true}
                        width={150}
                        fieldType="select"
                        fieldLabel="Duration type"
                        selectData={DurationTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'durationTypeLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}

                    />

                    <MyInput

                        disabled={drugKey != null ? editing : true}
                        column
                        fieldLabel="Chronic Medication"
                        fieldType="checkbox"
                        fieldName="chronicMedication"
                        record={orderMedication}
                        setRecord={setOrderMedication}

                    />


                </Form>
                <Form style={{ zoom: 0.85 }} fluid>

                    <MyInput

                        width={250}
                        disabled={drugKey != null ? editing : true}
                        fieldType="select"
                        fieldLabel="Administration Instructions"
                        selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'administrationInstructions'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                    /></Form>
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: "6px", width: '200px' }}>
                    <Text style={{ marginBottom: "10px", fontWeight: 'bold' }}>Parameters to monitor</Text>
                    <TagGroup className='taggroup-style'>
                        {tags.map((item, index) => (
                            <Tag key={index} closable onClose={() => removeTag(item)}>
                                {item}
                            </Tag>
                        ))}
                        {renderInput()}
                    </TagGroup>
                </div>



                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput

                        disabled={drugKey != null ? editing : true}
                        column

                        fieldLabel="Brand substitute allowed"
                        fieldType="checkbox"
                        fieldName="genericSubstitute"
                        record={orderMedication}
                        setRecord={setOrderMedication}

                    />
                </Form>
                <div style={{ width: "147px" }}></div>
                <Form style={{ zoom: 0.85 }} fluid>
                    <MyInput
                        column
                        disabled={true}
                        width={235}
                        fieldName={'PharmacyVerificationStatus'}
                        record={{}}
                        setRecord={() => ""}

                    /></Form>

            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '4px' }}>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>

                    <MyInput
                        column
                        disabled={drugKey != null ? editing : true}
                        width={150}
                        fieldType="number"
                        fieldName={'maximumDose'}
                        record={orderMedication}
                        setRecord={setOrderMedication}
                    />
                    <MyInput
                        column
                        disabled={drugKey != null ? editing : true}
                        width={150}
                        fieldType="select"
                        fieldLabel="priority Level"
                        selectData={priorityLevelLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'priorityLkey'}
                        record={orderMedication}
                        setRecord={setOrderMedication}

                    />
                    <MyInput
                        column
                        disabled={drugKey != null ? editing : true}
                        rows={1}
                        fieldType="textarea"
                        width={150}
                        fieldName={'specialInstructions'}
                        record={orderMedication}
                        setRecord={setOrderMedication}

                    />

                </Form>
                <Input as="textarea" onChange={(e) => setAdminInstructions(e)}
                    value={adminInstructions}
                    style={{ width: 250, height: '100px', zoom: 0.85 }}
                />
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                        column
                        disabled={drugKey != null ? editing : true}
                        rows={4}
                        fieldType="textarea"
                        width={235}
                        fieldName={'notes'}
                        record={orderMedication}
                        setRecord={setOrderMedication}

                    />
                    <MyInput

                        disabled={drugKey != null ? editing : true}
                        column
                        fieldType="checkbox"
                        fieldName="patientOwnMedication"
                        record={orderMedication}
                        setRecord={setOrderMedication}

                    />
                </Form>
                <div style={{ width: "150px" }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Form style={{ zoom: 0.85 }} fluid>

                        <MyInput
                            column
                            disabled={true}
                            rows={4}
                            fieldType="textarea"
                            width={235}
                            fieldName={'PharmacyVerificationNotes'}
                            record={{}}
                            setRecord={() => ""}

                        />


                    </Form>
                </div>
            </div>

        </div>
        <div className='mid-container-p '>
            <div >
                <IconButton
                    color="cyan"
                    appearance="primary"
                    onClick={handleSaveMedication}
                    icon={<PlusIcon />}
                    disabled={
                        orders?.object?.find(order =>
                            order.key === drugKey
                        )?.statusLkey === '1804482322306061'
                    }
                >
                    <Translate>Add</Translate>
                </IconButton>
                <IconButton
                    color="cyan"
                    appearance="primary"
                    style={{ marginLeft: "5px" }}
                    icon={<BlockIcon />}
                    onClick={() => setOpenCancellationReasonModel(true)}
                    disabled={orderMedication.key == null ? true : false}
                >
                    <Translate> Cancle</Translate>
                </IconButton>
                <Button
                    color="cyan"
                    appearance="primary"
                    style={{ marginLeft: "5px" }}
                    onClick={handleCleare}

                >

                    <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px' }} />
                    <span>Clear</span>
                </Button>

                <Checkbox
                    checked={!showCanceled}
                    onChange={() => {


                        setShowCanceled(!showCanceled);
                    }}
                >
                    Show canceled orders
                </Checkbox>
            </div>

            <Table
                height={600}
                data={orderMedications?.object || []}
                rowKey="key"
                expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                shouldUpdateScroll={false}
                bordered
                cellBordered
                onRowClick={rowData => {
                    setOrderMedication(rowData);
                    setEditing(rowData.statusLkey == "3196709905099521" ? true : false);
                    setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey))


                }}
                rowClassName={isSelected}
            >
                <Column width={70} align="center">
                    <HeaderCell>#</HeaderCell>
                    <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">

                        <Translate>Medication Name</Translate>
                    </HeaderCell>

                    <Cell dataKey="genericMedicationsKey" >
                        {rowData =>
                            genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                        }
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell align="center">
                        <Translate>Drug Order Type</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.drugOrderTypeLvalue?.lovDisplayVale
                        }
                    </Cell>
                </Column >

                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Instruction</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => {
                            return joinValuesFromArray([rowData.dose, rowData.doseUnitLvalue?.lovDisplayVale, "every " + rowData.frequency + " hours", rowData.roaLvalue?.lovDisplayVale]);
                        }
                        }
                    </Cell>
                </Column>

                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Start Date Time</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData.startDateTime ? new Date(rowData.startDateTime).toLocaleString() : " "}
                    </Cell>
                </Column>

                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Is Chronic</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => rowData.chronicMedication ? "Yes" : "NO"}

                    </Cell>
                </Column>

                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>priority Level</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
                        }
                    </Cell>
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell align="center">
                        <Translate>Status</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.statusLvalue?.lovDisplayVale
                        }
                    </Cell>
                </Column>
            </Table>
            <Modal open={openCancellationReasonModel} onClose={CloseCancellationReasonModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Confirm Cancel</h6></Translate>
                </Modal.Title>
                <Modal.Body>


                    <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                        <MyInput
                            width={250}

                            column
                            fieldLabel="Cancellation Reason"
                            fieldType="textarea"
                            fieldName="cancellationReason"
                            height={120}
                            record={orderMedication}
                            setRecord={setOrderMedication}
                        //   disabled={!editing}
                        />
                    </Form>

                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>
                        <Button appearance="primary" onClick={handleCancle}>
                            Cancel
                        </Button>
                        <Button appearance="ghost" color="cyan" onClick={CloseCancellationReasonModel}>
                            Close
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>
            <Modal size={'lg'} open={openSubstitutesModel} onClose={CloseSubstitutesModel} overflow  >
                <Modal.Title>
                    <Translate><h6>Substitues</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                    <Table
                        height={400}

                        headerHeight={50}
                        rowHeight={60}
                        bordered
                        cellBordered
                        data={lisOfLinkedBrand?.object ?? []}
                    //   onRowClick={rowData => {
                    //     setGenericMedication(rowData);
                    //   }}
                    //   rowClassName={isSelected}
                    >
                        <Column sortable flexGrow={2}>
                            <HeaderCell align="center">
                                <Translate>Code </Translate>
                            </HeaderCell>
                            <Cell dataKey="code" />
                        </Column>
                        <Column sortable flexGrow={2}>
                            <HeaderCell align="center">
                                <Translate>Brand Name </Translate>
                            </HeaderCell>
                            <Cell dataKey="genericName" />
                        </Column>
                        <Column sortable flexGrow={2}>
                            <HeaderCell align="center">

                                <Translate>Manufacturer</Translate>
                            </HeaderCell>
                            <Cell dataKey="manufacturerLkey">
                                {rowData =>
                                    rowData.manufacturerLvalue ? rowData.manufacturerLvalue.lovDisplayVale : rowData.manufacturerLkey
                                }
                            </Cell>
                        </Column>
                        <Column sortable flexGrow={2} fullText>
                            <HeaderCell align="center">

                                <Translate>Dosage Form</Translate>
                            </HeaderCell>
                            <Cell>
                                {rowData =>
                                    rowData.dosageFormLvalue ? rowData.dosageFormLvalue.lovDisplayVale : rowData.dosageFormLkey
                                }
                            </Cell>
                        </Column>

                        <Column sortable flexGrow={3} fullText>
                            <HeaderCell align="center">

                                <Translate>Usage Instructions</Translate>
                            </HeaderCell>
                            <Cell dataKey="usageInstructions" />
                        </Column>
                        <Column sortable flexGrow={2} fixed fullText>
                            <HeaderCell align="center">

                                <Translate>Rout</Translate>
                            </HeaderCell>
                            <Cell>
                                {rowData => rowData.roaList?.map((item, index) => {
                                    const value = conjureValueBasedOnKeyFromList(
                                        medRoutLovQueryResponse?.object ?? [],
                                        item,
                                        'lovDisplayVale'
                                    );
                                    return (
                                        <span key={index}>
                                            {value}
                                            {index < rowData.roaList.length - 1 && ', '}
                                        </span>
                                    );
                                })}
                            </Cell>
                        </Column>
                        <Column sortable flexGrow={2}>
                            <HeaderCell align="center">

                                <Translate>Expires After Opening</Translate>
                            </HeaderCell>
                            <Cell>
                                {rowData =>
                                    rowData.expiresAfterOpening ? 'Yes' : 'No'
                                }
                            </Cell>
                        </Column>
                        <Column sortable flexGrow={3}>
                            <HeaderCell align="center">

                                <Translate>Single Patient Use</Translate>
                            </HeaderCell>
                            <Cell>
                                {rowData =>
                                    rowData.singlePatientUse ? 'Yes' : 'No'
                                }
                            </Cell>
                        </Column>
                        <Column sortable flexGrow={1}>
                            <HeaderCell align="center">

                                <Translate>Status</Translate>
                            </HeaderCell>
                            <Cell>
                                {rowData =>
                                    rowData.deletedAt === null ? 'Active' : 'InActive'
                                }
                            </Cell>
                        </Column>

                    </Table>

                </Modal.Body>
                <Modal.Footer>
                    <Stack spacing={2} divider={<Divider vertical />}>

                        <Button appearance="ghost" color="cyan" onClick={CloseSubstitutesModel}>
                            Close
                        </Button>
                    </Stack>
                </Modal.Footer>
            </Modal>
        </div>

    </>)
};
export default DrugOrder;