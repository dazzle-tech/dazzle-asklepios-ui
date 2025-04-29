import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import PageIcon from '@rsuite/icons/Page';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import DocPassIcon from '@rsuite/icons/DocPass';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { List } from 'rsuite';
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
    Tag
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Toggle } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useSavePrescriptionMutation,
    useGetPrescriptionsQuery,
    useSavePrescriptionMedicationMutation,
    useGetPrescriptionMedicationsQuery,
    useSaveCustomeInstructionsMutation,
    useGetCustomeInstructionsQuery

} from '@/services/encounterService';
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
import { ApCustomeInstructions, ApGenericMedication, ApPrescription, ApPrescriptionMedications } from '@/types/model-types';
import { newApCustomeInstructions, newApGenericMedication, newApPrescription, newApPrescriptionMedications } from '@/types/model-types-constructor';
import {
    useGetGenericMedicationQuery
} from '@/services/medicationsSetupService';
import {
    useGetPrescriptionInstructionQuery,
    useGetLinkedBrandQuery,
    useGetGenericMedicationWithActiveIngredientQuery
} from '@/services/medicationsSetupService';
import {
    useGetAllergiesQuery
} from '@/services/observationService';
import {
    useGetIcdListQuery,
} from '@/services/setupService';
import MyButton from '@/components/MyButton/MyButton';
import DetailsModal from './DetailsModal';
import MyTable from '@/components/MyTable';
const Prescription = ({ edit, patient, encounter }) => {

    const dispatch = useAppDispatch();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);
    const [inst, setInst] = useState(null);
    const [tags, setTags] = React.useState([]);
    const [showCanceled, setShowCanceled] = useState(true);
    const [editing, setEditing] = useState(false);
    const [typing, setTyping] = React.useState(false);

    const [isMinimized, setIsMinimized] = useState(true);
    const [searchKeywordicd, setSearchKeywordicd] = useState('');
    const [searchKeywordSnomed, setSearchKeywordSnomed] = useState('');
    const [inputValue, setInputValue] = React.useState('');
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true
    });
    const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient.key
            },
            ,
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }

        ]
    });
    const [genericMedication, setGenericMedication] = useState<ApGenericMedication>({ ...newApGenericMedication });
    const [listGenericRequest, setListGenericRequest] = useState<ListRequest>({ ...initialListRequest });
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [selectedPreDefine, setSelectedPreDefine] = useState(null);
    const [munial, setMunial] = useState(null);
    const [adminInstructions, setAdminInstructions] = useState("");
    const [customeinst, setCustomeinst] = useState({
        dose: null,
        unit: null,
        frequency: null,
        roa: null
    });
    const [indicationsIcd, setIndicationsIcd] = useState({ indicationIcd: null });
    const [filteredList, setFilteredList] = useState([]);
    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    const { data: FrequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');
    const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: instructionTypeQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTR_TYPE');
    const { data: refillunitQueryResponse } = useGetLovValuesByCodeQuery('REFILL_INTERVAL');
    const { data: indicationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_INDICATION_USE');
    const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const [openSubstitutesModel, setOpenSubstitutesModel] = useState(false);
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
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
    const { data: lisOfLinkedBrand } = useGetLinkedBrandQuery(selectedGeneric?.key, { skip: selectedGeneric?.key == null });
    const { data: genericMedicationActiveIngredientListResponseData, refetch: refetchGenric } = useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);

    const { data: prescriptions, isLoading: isLoadingPrescriptions, refetch: preRefetch } = useGetPrescriptionsQuery({
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
    const filteredPrescriptions = prescriptions?.object?.filter(
        (item) => item.statusLkey === "1804482322306061"
    ) ?? [];

    const [preKey, setPreKey] = useState(null);


    const [prescription, setPrescription] = useState<ApPrescription>({
        ...prescriptions?.object?.find(prescription =>
            prescription.key === preKey
        )

    });

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
    const [prescriptionMedication, setPrescriptionMedications] = useState<ApPrescriptionMedications>(
        {
            ...newApPrescriptionMedications,
            prescriptionKey: preKey,
            duration: null,
            numberOfRefills: null

        });
    const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`,
    }));
    const isSelected = rowData => {
        if (rowData && prescriptionMedication && rowData.key === prescriptionMedication.key) {
            return 'selected-row';
        } else return '';
    };
    const [customeInstruction, setCustomeInstruction] = useState<ApCustomeInstructions>({ ...newApCustomeInstructions });
    const [savePrescription, savePrescriptionMutation] = useSavePrescriptionMutation();

    const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] = useSavePrescriptionMedicationMutation();


    const [saveCustomeInstructions, { isLoading: isSavingCustomeInstructions }] = useSaveCustomeInstructionsMutation();
    const [editDuration, setEditDuration] = useState(false);
    const { data: prescriptionMedications, isLoading: isLoadingPrescriptionMedications, refetch: medicRefetch } = useGetPrescriptionMedicationsQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "prescription_key",
                operator: "",
                value: preKey,
            },
            {
                fieldName: "status_lkey",
                operator: showCanceled ? "notMatch" : "match",
                value: "1804447528780744",
            }
        ],
    });
    const [selectedRowoMedicationKey, setSelectedRowoMedicationKey] = useState("");
    const { data: customeInstructions, isLoading: isLoadingCustomeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
        ...initialListRequest,

    });
    const [isdraft, setIsDraft] = useState(prescriptions?.object?.find(prescription =>
        prescription.key === preKey
    )?.saveDraft);


    useEffect(() => {

        const foundPrescription = prescriptions?.object?.find(prescription => prescription.key === preKey);
        if (foundPrescription?.saveDraft !== isdraft) {
            setIsDraft(foundPrescription?.saveDraft);
        }

    }, [prescriptions, preKey]);
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
        if (prescriptions?.object) {
            const foundPrescription = prescriptions.object.find(prescription => {

                return prescription.saveDraft === true;
            });

            if (foundPrescription?.key != null) {
                setPreKey(foundPrescription?.key);
                setPrescription(foundPrescription)
            }

        }

    }, [prescriptions]);

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
        setPrescriptionMedications({ ...prescriptionMedication, instructionsTypeLkey: selectedOption })

    }, [selectedOption])
    useEffect(() => {
        if (prescriptionMedication.administrationInstructions != null) {
            setAdminInstructions(prevadminInstructions =>
                prevadminInstructions ? `${prevadminInstructions}, ${administrationInstructionsLovQueryResponse?.object?.find(
                    item => item.key === prescriptionMedication.administrationInstructions
                )?.lovDisplayVale}` :
                    administrationInstructionsLovQueryResponse?.object?.find(
                        item => item.key === prescriptionMedication.administrationInstructions
                    )?.lovDisplayVale
            );
        }

        setPrescriptionMedications({ ...prescriptionMedication, administrationInstructions: null })
    }, [prescriptionMedication.administrationInstructions])
    useEffect(() => {

        setEditDuration(prescriptionMedication.chronicMedication);
        setPrescriptionMedications({ ...prescriptionMedication, duration: null, durationTypeLkey: null })
    }, [prescriptionMedication.chronicMedication])

    useEffect(() => {

    }, [selectedPreDefine, munial])
    useEffect(() => {

    }, [customeinst])
    useEffect(() => {

        refetchCo();

        setCustomeinst({
            ...customeinst,
            unit: customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === selectedRowoMedicationKey)?.unitLkey,
            frequency: customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === selectedRowoMedicationKey)?.frequencyLkey,
            dose: customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === selectedRowoMedicationKey)?.dose,
        })
    }, [selectedRowoMedicationKey]);

    useEffect(() => {
        const saveData = async () => {
            if (inst != null) {


                if (preKey === null) {
                    dispatch(notify('Prescription not linked. Try again'));
                    return;
                }

                const tagcompine = joinValuesFromArray(tags);

                try {
                    await savePrescriptionMedication({
                        ...prescriptionMedication,
                        patientKey: patient.key,
                        visitKey: encounter.key,
                        prescriptionKey: preKey,
                        genericMedicationsKey: selectedGeneric.key,
                        parametersToMonitor: tagcompine,
                        statusLkey: "164797574082125",
                        instructions: inst,
                        dose: selectedOption === "3010606785535008" ? customeinst.dose : null,
                        frequencyLkey: selectedOption === "3010606785535008" ? customeinst.frequency : null,
                        unitLkey: selectedOption === "3010606785535008" ? customeinst.unit : null,
                        roaLkey: selectedOption === "3010606785535008" ? customeinst.roa : null,
                        administrationInstructions: adminInstructions,
                        indicationIcd: indicationsDescription
                    }).unwrap();

                    dispatch(notify('Saved successfully'));

                    // Perform refetches
                    await Promise.all([
                        medicRefetch().then(() => ""),
                        refetchCo().then(() => "")
                    ]);

                    handleCleare();
                } catch (error) {
                    console.error("Save failed:", error);
                    dispatch(notify('Save failed'));
                }
            }
        };

        saveData();
    }, [inst]);

    useEffect(() => {
        if (preKey == null) {
            handleCleare()
        }
        if (prescriptions?.object) {
            const foundPrescription = prescriptions.object.find(prescription => {
                return prescription.key === preKey;
            });

            setPrescription(foundPrescription)
        }
    }, [preKey]);

    useEffect(() => {

    }, [adminInstructions])
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
    const handleSearch = value => {
        setSearchKeyword(value);
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
    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    const removeTag = tag => {
        const nextTags = tags.filter(item => item !== tag);
        setTags(nextTags);
    };
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
    const handleCancle = async () => {
        try {
            await Promise.all(
                selectedRows.map(item => savePrescriptionMedication({ ...item, isValid: false, statusLkey: "1804447528780744", deletedAt: Date.now() }).unwrap())
            );

            dispatch(notify('All medication deleted successfully'));
            medicRefetch().then(() => {

            }).catch((error) => {

            });
            medicRefetch().then(() => {

            }).catch((error) => {

            });


            setSelectedRows([]);

        } catch (error) {

            dispatch(notify('One or more deleted failed'));

        }
    };
    const handleSubmitPres = async () => {
        try {
            await savePrescription({
                ...prescriptions?.object?.find(prescription =>
                    prescription.key === preKey
                ),

                statusLkey: "1804482322306061"
                , saveDraft: false,
                submittedAt: Date.now()
            }).unwrap();
            dispatch(notify('submetid  Successfully'));
            handleCleare();
            preRefetch().then(() => "");
            medicRefetch().then(() => "");

        }
        catch (error) {
            console.error("Error saving prescription or medications:", error);
        }

        prescriptionMedications?.object?.map((item) => {
            savePrescriptionMedication({ ...item, statusLkey: "1804482322306061" })
        })
        medicRefetch().then(() => "");



    }

    const handleSaveMedication = () => {

        if (selectedOption === '3010591042600262') {
            setInst(selectedPreDefine.key);
        }
        else if (selectedOption === '3010573499898196') {
            setInst(munial);
        }
        else {
            setInst("");
        }
    }

    const handleCleare = () => {
        setPrescriptionMedications({
            ...newApPrescriptionMedications,
            durationTypeLkey: null,
            administrationInstructions: null,
            instructionsTypeLkey: null,
            genericSubstitute: false,
            chronicMedication: false,
            refillIntervalUnitLkey: null,
            indicationUseLkey: null
        })
        setAdminInstructions("");
        setSelectedGeneric(null);
        setindicationsDescription(null);

        setCustomeinst({ dose: null, frequency: null, unit: null, roa: null })
        setTags([])
    }
    const handleSearchIcd = value => {
        setSearchKeywordicd(value);
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

    const handleItemClick = (Generic) => {
        setSelectedGeneric(Generic);
        refetchGenric().then(() => "");
        setSearchKeyword("")
        const newList = roaLovQueryResponse.object.filter((item) =>
            (Generic.roaList).includes(item.key)
        );
        setFilteredList(newList);

    };

    const saveDraft = async () => {
        try {
            await savePrescription({
                ...prescriptions?.object?.find(prescription =>
                    prescription.key === preKey
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
            await savePrescription({
                ...prescriptions?.object?.find(prescription =>
                    prescription.key === preKey
                ),
                saveDraft: false
            }).then(() => {
                dispatch(notify(' Draft Canceld'));
                setIsDraft(false);
            })
        } catch (error) { }

    }
    const handleSavePrescription = async () => {
        handleCleare();
        setPreKey(null);
        setPrescription(null);

        if (patient && encounter) {
            try {

                const response = await savePrescription({
                    ...newApPrescription,
                    patientKey: patient.key,
                    visitKey: encounter.key,
                    statusLkey: "164797574082125",
                });


                dispatch(notify('Start New Prescription whith ID:' + response?.data?.prescriptionId));

                setPreKey(response?.data?.key);
                setPrescription(response?.data);
                preRefetch().then(() => "");

            } catch (error) {
                console.error("Error saving prescription:", error);
            }
        } else {
            console.warn("Patient or encounter is missing. Cannot save prescription.");
        }
    };
    const CloseSubstitutesModel = () => {
        setOpenSubstitutesModel(false);
    }

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

    const tableColumns = [
        {
            key:"#",         
            title:<Translate>#</Translate> ,
            flexGrow: 1,
            render: (rowData: any) => {
                return (
                    <Checkbox
                        key={rowData.id}
                        checked={selectedRows.includes(rowData)}
                        onChange={() => handleCheckboxChange(rowData)}
                        disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
                    />
                )
            },

        }
        ,

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
            key: 'instructions',
            dataKey: '',
            title: 'Instructions',
            flexGrow:3,
            render: (rowData: any) =>  {
                if (rowData.instructionsTypeLkey === "3010591042600262") {
                    const generic = predefinedInstructionsListResponse?.object?.find(
                        item => item.key === rowData.instructions
                    );

                    if (generic) {
                        console.log("Found generic:", generic);
                    } else {
                        console.warn("No matching generic found for key:", rowData.instructions);
                    }
                    return [
                        generic?.dose,
                        generic?.unitLvalue?.lovDisplayVale,
                        generic?.routLvalue?.lovDisplayVale,
                        generic?.frequencyLvalue?.lovDisplayVale


                    ]
                        .filter(Boolean)
                        .join(', ');
                }
                if (rowData.instructionsTypeLkey === "3010573499898196") {
                    return rowData.instructions

                }
                if (rowData.instructionsTypeLkey === "3010606785535008") {
                    return customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose +
                        "," + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue.lovDisplayVale + "," +
                        customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue.lovDisplayVale


                }

                return "no";
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
            key: 'instructionsType',
            dataKey: 'instructionsTypeLkey',
            title: 'Instructions Type',
            flexGrow: 2,
            render: (rowData: any) => {
                return rowData.instructionsTypeLvalue ? rowData.instructionsTypeLvalue.lovDisplayVale : rowData.instructionsTypeLkey;
            }
        },
        {
            key: 'validUtil',
            dataKey: 'validUtil',
            title: 'Valid Util',
            flexGrow: 2,
            
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
        
    ];
    return (
    < >
        <div className={edit ? "disabled-panel bt-div" : "bt-div"} >
            <div style={{ width: '500px' }}>
                <SelectPicker
                    className='fill-width'
                    data={filteredPrescriptions ?? []}
                    labelKey="prescriptionId"
                    valueKey="key"
                    placeholder="prescription"
                    value={preKey ?? null}
                    onChange={e => {

                        setPreKey(e);
                    }}

                />

            </div>
            <Text>Prescription# {prescriptions?.object?.find(prescription =>
                prescription.key === preKey
            )?.prescriptionId}</Text>

            <div className='bt-right'>
                <MyButton
                    onClick={handleSavePrescription}
                    disabled={isdraft}
                    prefixIcon={() => <PlusIcon />}
                >New Prescription</MyButton>
                <MyButton
                    onClick={handleSubmitPres}
                    disabled={preKey ?
                        prescriptions?.object?.find(prescription =>
                            prescription.key === preKey
                        )?.statusLkey === '1804482322306061' : true
                    }
                    prefixIcon={() => <CheckIcon />}>
                    Submit Prescription
                </MyButton>
                {
                    !isdraft &&
                    <MyButton
                        onClick={saveDraft}
                        prefixIcon={() => <DocPassIcon />}
                        disabled={preKey ?
                            prescriptions?.object?.find(prescription =>
                                prescription.key === preKey
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
                        prefixIcon={() => <DocPassIcon />}
                        disabled={preKey ?
                            prescriptions?.object?.find(prescription =>
                                prescription.key === preKey
                            )?.statusLkey === '1804482322306061' : true
                        }
                    >
                        Cancle draft
                    </MyButton>

                }
            </div>
        </div>
        <Divider />

        <div className={`top-container-p ${edit ? "disabled-panel" : ""}`}>
            <div className='form-search-container-p '>
                <Form>
                    <Text>Medication Name</Text>
                    <InputGroup inside className='input-search-p'>
                        <Input
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
                        disabled={preKey ?
                            prescriptions?.object?.find(prescription =>
                                prescription.key === preKey
                            )?.statusLkey === '1804482322306061' : true
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
                        disabled={preKey ?
                            prescriptions?.object?.find(prescription =>
                                prescription.key === preKey
                            )?.statusLkey === '1804482322306061' : true
                        }
                    >
                        <Translate> Cancle draft</Translate>
                    </IconButton>

                }
                <IconButton
                    color="violet"
                    appearance="primary"
                    onClick={handleSubmitPres}
                    disabled={preKey ?
                        prescriptions?.object?.find(prescription =>
                            prescription.key === preKey
                        )?.statusLkey === '1804482322306061' : true
                    }

                    icon={<CheckIcon />}
                >
                    <Translate>Submit Prescription</Translate>
                </IconButton>
                <IconButton
                    color="cyan"
                    appearance="primary"
                    disabled={preKey ?
                        prescriptions?.object?.find(prescription =>
                            prescription.key === preKey
                        )?.statusLkey === '1804482322306061' : true
                    }
                    icon={<PageIcon />}
                >
                    <Translate> Print Prescription</Translate>
                </IconButton>



            </div>
        </div>
        <br />

        <div className={`instructions-container-p ${edit ? "disabled-panel" : ""}`}>
            <div style={{ marginLeft: "10px", display: 'flex', flexDirection: 'column', border: " 1px solid #b6b7b8" }}>
                <div className='instructions-container-p ' style={{ minWidth: "800px" }}>
                    <div>
                        <RadioGroup
                            name="radio-group"
                            disabled={preKey != null ? editing : true}

                            onChange={(value) => setSelectedOption(String(value))}
                        >
                            {instructionTypeQueryResponse?.object?.map((instruction, index) => (
                                <Radio key={index} value={instruction.key}>
                                    {instruction.lovDisplayVale}
                                </Radio>
                            ))}
                        </RadioGroup>
                    </div>
                    <div style={{ marginLeft: "10px" }}>
                        {selectedOption === "3010606785535008" &&
                            <div className='form-search-container-p ' style={{ width: "600px" }}>
                                <Form layout="inline" fluid disabled={preKey != null ? editing : true}>
                                    <MyInput
                                        column

                                        width={150}
                                        fieldType='number'
                                        fieldName={'dose'}
                                        record={customeinst}
                                        setRecord={setCustomeinst}
                                    />

                                    <MyInput
                                        column

                                        width={150}
                                        fieldType="select"
                                        fieldLabel="Unit"
                                        selectData={unitLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'unit'}
                                        record={customeinst}
                                        setRecord={setCustomeinst}
                                    />
                                    <MyInput
                                        column
                                        width={150}
                                        fieldType="select"
                                        fieldLabel="Frequency"
                                        selectData={FrequencyLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'frequency'}
                                        record={customeinst}
                                        setRecord={setCustomeinst}
                                    />
                                    <MyInput
                                        column
                                        width={150}
                                        fieldType="select"
                                        fieldLabel="ROA"
                                        selectData={filteredList ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        fieldName={'roa'}
                                        record={customeinst}
                                        setRecord={setCustomeinst}
                                    />
                                </Form>

                            </div>
                        }
                        {selectedOption === "3010591042600262" &&
                            <Form layout="inline" fluid>

                                <Dropdown style={{ width: "200px" }} title={!selectedPreDefine ? "Pre-defined Instructions" : [
                                    selectedPreDefine.dose,

                                    selectedPreDefine.unitLvalue?.lovDisplayVale,
                                    selectedPreDefine.routLvalue?.lovDisplayVale,
                                    selectedPreDefine.frequencyLvalue?.lovDisplayVale
                                ]
                                    .filter(Boolean)
                                    .join(', ')}>
                                    {predefinedInstructionsListResponse && predefinedInstructionsListResponse?.object?.map((item, index) => (
                                        <Dropdown.Item key={index}
                                            onClick={() => setSelectedPreDefine(item)}>
                                            {[item.dose,

                                            item.unitLvalue?.lovDisplayVale,
                                            item.routLvalue?.lovDisplayVale,
                                            item.frequencyLvalue?.lovDisplayVale
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}</Dropdown.Item>
                                    ))}
                                </Dropdown>
                            </Form>
                        }
                        {selectedOption === "3010573499898196" &&
                            <Form layout="inline" fluid>
                                <textarea
                                    rows={4}
                                    style={{ width: '350px' }}
                                    disabled={false}
                                    value={munial}
                                    onChange={(e) => setMunial(e.target.value)}

                                />


                            </Form>
                        }

                    </div>
                </div>
                <Divider style={{ fontWeight: 'bold' }}>Indication</Divider>
                <div style={{ border: '2px solid #b6b7b8"', padding: '5px', display: 'flex', gap: '5px' }}>



                    <div style={{ marginBottom: '3px' }}>
                        <InputGroup inside style={{ width: '300px', marginTop: '28px' }}>
                            <Input
                                disabled={preKey != null ? editing : true}
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
                                || prescriptionMedication.indicationIcd
                            }
                            style={{ width: 300 }} rows={4} />
                    </div>
                    <div style={{ marginBottom: '3px' }}>
                        <InputGroup inside style={{ width: '300px', marginTop: '28px' }}>
                            <Input
                                disabled={preKey != null ? editing : true}
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
                    <div style={{ marginBottom: '3px' }}>
                        <Form layout="inline" fluid>
                            <MyInput
                                column
                                disabled={preKey != null ? editing : true}
                                width={200}

                                fieldType="select"
                                fieldLabel="Indication Use"
                                selectData={indicationLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'indicationUseLkey'}
                                record={prescriptionMedication}
                                setRecord={setPrescriptionMedications}

                            />
                        </Form>
                        <Input
                            as="textarea"
                            placeholder="Write Indication Manually"
                            disabled={preKey != null ? editing : true}
                            value={prescriptionMedication.indicationManually}
                            onChange={(e) => {

                                setPrescriptionMedications({ ...prescriptionMedication, indicationManually: e });
                            }}
                            style={{ width: 200 }}
                            rows={4}
                        />

                    </div>

                </div>
            </div>

        </div>
        <br />
        <div className={edit ? "disabled-panel" : ""} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #b6b7b8' }}>

            <div style={{ display: 'flex', gap: '10px', padding: '4px' }}>
                <Form layout="inline" fluid>


                    <MyInput
                        column
                        disabled={preKey != null ? (!editing ? editDuration : editing) : true}
                        width={150}
                        fieldType="number"
                        fieldLabel="Duration"
                        fieldName={'duration'}
                        placholder={' '}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />

                    <MyInput
                        column
                        disabled={preKey != null ? (!editing ? editDuration : editing) : true}
                        width={150}
                        fieldType="select"
                        fieldLabel="Duration type"
                        selectData={DurationTypeLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'durationTypeLkey'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}

                    />
                    <MyInput
                        column
                        disabled={preKey != null ? editing : true}
                        width={150}
                        fieldType="number"
                        fieldName={'maximumDose'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />

                </Form>
                <Form fluid>

                    <MyInput

                        width={250}
                        disabled={preKey != null ? editing : true}
                        fieldType="select"
                        fieldLabel="Administration Instructions"
                        selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'administrationInstructions'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
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


                <Form style={{ zoom: 0.90 }}>
                    <MyInput

                        disabled={preKey != null ? editing : true}
                        column
                        fieldLabel="Chronic Medication"
                        fieldType="checkbox"
                        fieldName="chronicMedication"
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}

                    /></Form>

                <Form style={{ zoom: 0.90 }}>
                    <MyInput

                        disabled={preKey != null ? editing : true}
                        column

                        fieldLabel="Brand substitute allowed"
                        fieldType="checkbox"
                        fieldName="genericSubstitute"
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}

                    /></Form>

            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '4px' }}>
                <Form layout="inline" fluid>


                    <MyInput
                        column
                        disabled={preKey != null ? editing : true}
                        fieldType='number'
                        width={150}
                        fieldName={'numberOfRefills'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />

                    <MyInput
                        column
                        disabled={preKey != null ? editing : true}

                        fieldType='number'
                        width={150}
                        fieldName={'refillIntervalValue'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />
                    <MyInput
                        column
                        disabled={preKey != null ? editing : true}
                        width={150}
                        fieldType="select"
                        fieldLabel="Refill Interval Unit"
                        selectData={refillunitQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'refillIntervalUnitLkey'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />
                </Form>
                <Input as="textarea" onChange={(e) => setAdminInstructions(e)}
                    value={adminInstructions}
                    style={{ width: 250 }}
                    rows={3} />
                <Form layout="inline" fluid>
                    <MyInput
                        column
                        disabled={preKey != null ? editing : true}
                        rows={5}
                        fieldType="textarea"
                        width={235}
                        fieldName={'notes'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}

                    />
                </Form>
                <Form layout="inline" fluid>
                    <MyInput
                        column
                        disabled={preKey != null ? editing : true}
                        width={150}
                        fieldType="date"
                        fieldName={'validUtil'}
                        record={prescriptionMedication}
                        setRecord={setPrescriptionMedications}
                    />


                </Form>
            </div>
        </div>
        <div className='bt-div'>
            <MyButton
                prefixIcon={() => <BlockIcon />}
                onClick={handleCancle}
                disabled={selectedRows.length === 0}
            >
                Cancle
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
                Show canceled Prescription
            </Checkbox>
            <div className='bt-right'>
                <MyButton
                    prefixIcon={() => <PlusIcon />}
                    onClick={() => setOpenDetailsModal(true)}

                >
                    Add Medication
                </MyButton>
            </div>
        </div>

        <div >
            <IconButton
                color="cyan"
                appearance="primary"
                onClick={handleSaveMedication}
                icon={<PlusIcon />}
                disabled={
                    prescriptions?.object?.find(prescription =>
                        prescription.key === preKey
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
                onClick={handleCancle}
                disabled={selectedRows.length === 0}
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
                Show canceled Prescription
            </Checkbox>
        </div>
        <MyTable 
        columns={tableColumns}
         data={prescriptionMedications?.object ?? []}
         onRowClick={rowData => {
             setPrescriptionMedications(rowData);
             setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey))
             setTags(rowData.parametersToMonitor.split(",").map(word => word.trim()))
             if (rowData.instructionsTypeLkey == "3010591042600262") {
                 setSelectedPreDefine(predefinedInstructionsListResponse?.object?.find(item => item.key === rowData.instructions))
                 setSelectedOption("3010591042600262")
             }
             else if (rowData.instructionsTypeLkey == "3010573499898196") {
                 setMunial(rowData.instructions)
                 setSelectedOption("3010573499898196")
             }
             else if (rowData.instructionsTypeLkey == "3010606785535008") {
                 setSelectedOption("3010606785535008")
                 setSelectedRowoMedicationKey(rowData.key);
             }
             setEditing(rowData.statusLkey == "164797574082125" ? false : true)
         }}
         loading={isLoadingPrescriptionMedications}
        ></MyTable>
        {/* <Table
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

            data={prescriptionMedications?.object ?? []}
            onRowClick={rowData => {
                setPrescriptionMedications(rowData);
                setSelectedGeneric(genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey))
                setTags(rowData.parametersToMonitor.split(",").map(word => word.trim()))
                if (rowData.instructionsTypeLkey == "3010591042600262") {
                    setSelectedPreDefine(predefinedInstructionsListResponse?.object?.find(item => item.key === rowData.instructions))
                    setSelectedOption("3010591042600262")
                }
                else if (rowData.instructionsTypeLkey == "3010573499898196") {
                    setMunial(rowData.instructions)
                    setSelectedOption("3010573499898196")
                }
                else if (rowData.instructionsTypeLkey == "3010606785535008") {
                    setSelectedOption("3010606785535008")
                    setSelectedRowoMedicationKey(rowData.key);
                }
                setEditing(rowData.statusLkey == "164797574082125" ? false : true)
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
                    <Input onChange={e => handleFilterChange('genericMedicationsKey', e)} />
                    <Translate>Medication Name</Translate>
                </HeaderCell>

                <Cell dataKey="genericMedicationsKey" >
                    {rowData =>
                        genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                    }
                </Cell>
            </Column>
            <Column flexGrow={4}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('instructions', e)} />
                    <Translate>Instructions</Translate>
                </HeaderCell>
                <Cell>
                    {rowData => {
                        if (rowData.instructionsTypeLkey === "3010591042600262") {
                            const generic = predefinedInstructionsListResponse?.object?.find(
                                item => item.key === rowData.instructions
                            );

                            if (generic) {
                                console.log("Found generic:", generic);
                            } else {
                                console.warn("No matching generic found for key:", rowData.instructions);
                            }
                            return [
                                generic?.dose,
                                generic?.unitLvalue?.lovDisplayVale,
                                generic?.routLvalue?.lovDisplayVale,
                                generic?.frequencyLvalue?.lovDisplayVale


                            ]
                                .filter(Boolean)
                                .join(', ');
                        }
                        if (rowData.instructionsTypeLkey === "3010573499898196") {
                            return rowData.instructions

                        }
                        if (rowData.instructionsTypeLkey === "3010606785535008") {
                            return customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose +
                                "," + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue.lovDisplayVale + "," +
                                customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue.lovDisplayVale


                        }

                        return "no";
                    }}




                </Cell>
            </Column>
            <Column flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('validUtil', e)} />
                    <Translate>Instructions Type</Translate>
                </HeaderCell>
                <Cell >
                    {rowData => rowData.instructionsTypeLkey ? rowData.instructionsTypeLvalue.lovDisplayVale : rowData.instructionsTypeLkey}
                </Cell>
            </Column>
            <Column flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('validUtil', e)} />
                    <Translate>Valid until</Translate>
                </HeaderCell>
                <Cell dataKey="validUtil" />
            </Column>

            <Column flexGrow={2}>
                <HeaderCell align="center">
                    <Input onChange={e => handleFilterChange('ststusLvalue', e)} />
                    <Translate>Status</Translate>
                </HeaderCell>
                <Cell >{rowData => rowData.statusLvalue?.lovDisplayVale || ''}
                </Cell>
            </Column>


            <Column flexGrow={2}>
                <HeaderCell align="center">

                    <Translate>Is Chronic</Translate>
                </HeaderCell>
                <Cell  >
                    {rowData => rowData.chronicMedication ? "Yes" : "NO"}


                </Cell>
            </Column>
        </Table> */}

        <DetailsModal open={openDetailsModal}
            setOpen={setOpenDetailsModal}
            patient={patient}
            encounter={encounter}
            prescriptionMedication={prescriptionMedication}
            setPrescriptionMedications={setPrescriptionMedications}
            preKey={preKey}
            editing={editing}
            medicRefetch={medicRefetch} />
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
        </>
       
);}


        export default Prescription;
