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
    Row,
    Col,



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
import Substitues from './Substitutes';
import CancellationModal from '@/components/CancellationModal';
import InfoCardList from '@/components/InfoCardList';
import DetailsModal from './DetailsModal';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
const DrugOrder = ({ edit, patient, encounter }) => {

    const dispatch = useAppDispatch();
    const [drugKey, setDrugKey] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
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
    const [adminInstructions, setAdminInstructions] = useState("");
    const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);

    const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
    const [openDetailsModel, setOpenDetailsModel] = useState(false);
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [listGenericRequest, setListGenericRequest] = useState<ListRequest>({ ...initialListRequest });
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ORDER_ADMIN_NSTRUCTIONS');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');

    const { data: orders, refetch: ordRefetch } = useGetDrugOrderQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient.key,
            },
            {
                fieldName: "visit_key",
                operator: "match",
                value: encounter.key,
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
                    style={{ width: 70, borderRadius: 5 }}
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
        handleCleare();

        if (patient && encounter) {
            try {

                const response = await saveDrugorder({
                    ...newApDrugOrder,
                    patientKey: patient.key,
                    visitKey: encounter.key,
                    statusLkey: "164797574082125",
                });


                dispatch(notify('Start New Order whith ID:' + response?.data?.drugorderId));

                setDrugKey(response?.data?.key);

                ordRefetch().then(() => {

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
        try {
            const tagcompine = joinValuesFromArray(tags);
            saveDrugorderMedication({
                ...orderMedication,
                patientKey: patient.key,
                visitKey: encounter.key,
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


    const tableColumns = [

        {
            key: 'medicationName',
            dataKey: 'genericMedicationsKey',
            title: 'Medication Name',
            flexGrow: 2,
            render: (rowData: any) => {
                return genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName;
            }
        },
        {
            key: 'drugOrderType',
            dataKey: 'drugOrderTypeLkey',
            title: 'Drug Order Type',
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.drugOrderTypeLvalue ? rowData.drugOrderTypeLvalue?.lovDisplayVale : rowData.drugOrderTypeLkey;
            }
        },
        {
            key: 'instruction',
            dataKey: '',
            title: 'Instruction',
            flexGrow: 2,
            render: (rowData: any) => {
                return joinValuesFromArray([rowData.dose, rowData.doseUnitLvalue?.lovDisplayVale, rowData.drugOrderTypeLkey == '2937757567806213' ? "STAT" : "every " + rowData.frequency + " hours", rowData.roaLvalue?.lovDisplayVale]);
            }
        },
        {
            key: 'startDateTime',
            dataKey: 'startDateTime',
            title: 'Start Date Time',
            flexGrow: 2,
            render: (rowData: any) => {
                return rowData.startDateTime ? new Date(rowData.startDateTime).toLocaleString() : "";
            }
        },
        {
            key: 'isChronic',
            dataKey: 'chronicMedication',
            title: 'Is Chronic',
            flexGrow: 2,
            render: (rowData: any) => {
                return rowData.chronicMedication ? "Yes" : "No";
            }
        },
        {
            key: 'priorityLevel',
            dataKey: 'priorityLkey',
            title: 'Priority Level',
            flexGrow: 2,
            render: (rowData: any) => {
                return rowData.priorityLvalue ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey;
            }
        },
        {
            key: 'status',
            dataKey: 'statusLkey',
            title: 'Status',
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey;
            },
        },
        {
            key: 'createdAt',
            dataKey: 'createdAt',
            title: 'Created At',
            flexGrow: 2,
            expandable: true,
            render: (rowData: any) => {
                return rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : "";
            }
        },
        {
            key: 'createdBy',
            dataKey: 'createdBy',
            title: 'Created By',
            flexGrow: 2,
            render: (rowData: any) => {
                return rowData.createdBy;
            }
        }
        ,
        {
            key: 'deletedAt',
            dataKey: 'deletedAt',
            title: 'Cancelled At',
            flexGrow: 2,
            expandable: true,
            render: (rowData: any) => {
                return rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : "";
            }
        },
        {
            key: 'deletedBy',
            dataKey: 'deletedBy',
            title: 'Cancelled By',
            flexGrow: 2,
            expandable: true,
            render: (rowData: any) => {
                return rowData.deletedBy;
            }
        }
        ,
        {
            key: 'cancellationReason',
            dataKey: 'cancellationReason',
            title: 'Cancellation Reason',
            flexGrow: 2,
            expandable: true,
            render: (rowData: any) => {
                return rowData.cancellationReason;
            }
        }
    ];
    return (<><h5 style={{ marginTop: "10px" }}>Drug Order</h5>
       
     
        <div className='bt-div'
        //  className={edit ? "disabled-panel" : ""}
         >
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
            <Text>Order# : {orders?.object?.find(order =>
                    order.key === drugKey
                )?.drugorderId}</Text>
            <div className='bt-right'>
                
                <MyButton
                prefixIcon={() => <PlusIcon />}
                onClick={handleSaveOrder}
                disabled={isdraft}
                >New Order</MyButton>
                <MyButton
                prefixIcon={()=><CheckIcon />}
                onClick={handleSubmitPres}

                disabled={drugKey ?
                    orders?.object?.find(order =>
                        order.key === drugKey
                    )?.statusLkey === '1804482322306061' : true
                }
                >Submit Order</MyButton>
                {
                    !isdraft &&
                    <MyButton
                        onClick={saveDraft}
                       prefixIcon={()=><DocPassIcon />}
                        disabled={drugKey ?
                            orders?.object?.find(order =>
                                order.key === drugKey
                            )?.statusLkey === '1804482322306061' : true
                        }
                    >
                       Save draft
                    </MyButton>

                }
                {
                    isdraft &&
                    <MyButton
                      
                        appearance="ghost"
                        onClick={cancleDraft}
                        prefixIcon={()=><DocPassIcon />}
                        disabled={drugKey ?
                            orders?.object?.find(order =>
                                order.key === drugKey
                            )?.statusLkey === '1804482322306061' : true
                        }
                    >
                         Cancle draft
                    </MyButton>

                }
            </div>
        </div>
     
        <Divider/>
       


        <div className='mid-container-p '>
            <div className='bt-div'>

                <MyButton

                    prefixIcon={() => <BlockIcon />}
                    onClick={() => setOpenCancellationReasonModel(true)}
                    disabled={orderMedication.key == null ? true : false}
                >
                    <Translate> Cancle</Translate>
                </MyButton>
                <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
                    onClick={handleCleare}

                >
                    Clear
                </MyButton>

                <Checkbox
                    checked={!showCanceled}
                    onChange={() => {


                        setShowCanceled(!showCanceled);
                    }}
                >
                    Show canceled orders
                </Checkbox>
                <div className='bt-right'>
                    <MyButton
                        prefixIcon={() => <PlusIcon />}
                        onClick={() => setOpenDetailsModel(true)}
                    >Add Medication</MyButton>
                </div>
            </div>
            <MyTable
                columns={tableColumns}
                data={orderMedications?.object || []}
                onRowClick={rowData => {
                    setOrderMedication(rowData);
                    setEditing(rowData.statusLkey == "3196709905099521" ? true : false);
                    setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey))
                }}

            ></MyTable>


            <CancellationModal
                open={openCancellationReasonModel}
                setOpen={setOpenCancellationReasonModel}
                handleCancle={handleCancle}
                fieldName='cancellationReason'
                title="Cancellation"
                fieldLabel="Cancellation Reason"
                object={orderMedication}
                setObject={setOrderMedication}>

            </CancellationModal>

            <DetailsModal
                open={openDetailsModel}
                setOpen={setOpenDetailsModel}
                orderMedication={orderMedication}
                setOrderMedication={setOrderMedication}
                drugKey={drugKey}
                editing={editing}
                patient={patient}
                encounter={encounter}
                medicRefetch={medicRefetch}


            ></DetailsModal>
        </div>

    </>)
};
export default DrugOrder;