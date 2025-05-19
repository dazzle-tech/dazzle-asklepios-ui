import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
    useGetCustomeInstructionsQuery,
    useGetPrescriptionMedicationsQuery,
    useGetPrescriptionsQuery,
    useSavePrescriptionMedicationMutation,
    useSavePrescriptionMutation
} from '@/services/encounterService';
import {
    useGetGenericMedicationWithActiveIngredientQuery,
    useGetPrescriptionInstructionQuery
} from '@/services/medicationsSetupService';
import { ApPrescriptionMedications } from '@/types/model-types';
import { newApPrescription, newApPrescriptionMedications } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import DocPassIcon from '@rsuite/icons/DocPass';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useEffect, useState } from 'react';
import { FaFilePrescription } from "react-icons/fa6";
import { MdModeEdit } from 'react-icons/md';
import { formatDateWithoutSeconds } from '@/utils';
import {
    Checkbox,
    Divider,
    SelectPicker,
    Table
} from 'rsuite';
import DetailsModal from './DetailsModal';
import './styles.less';
import { useLocation } from 'react-router-dom';
const { Column, HeaderCell, Cell } = Table;
const Prescription = () => {
    const location = useLocation();
        const { patient, encounter, edit } = location.state || {};
    const dispatch = useAppDispatch();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [openToAdd, setOpenToAdd] = useState(true);
    const [openCancellation,setOpenCancellation]=useState(false)
    const [showCanceled, setShowCanceled] = useState(true);
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const [customeinst, setCustomeinst] = useState({
        dose: null,
        unit: null,
        frequency: null,
        roa: null
    });

    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
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
    const [prescriptionMedication, setPrescriptionMedications] = useState<ApPrescriptionMedications>(
        {
            ...newApPrescriptionMedications,
            prescriptionKey: preKey,
            duration: null,
            numberOfRefills: null

        });

    const isSelected = rowData => {
        if (rowData && prescriptionMedication && rowData.key === prescriptionMedication.key) {
            return 'selected-row';
        } else return '';
    };

    const [savePrescription, savePrescriptionMutation] = useSavePrescriptionMutation();

    const [savePrescriptionMedication, { isLoading: isSavingPrescriptionMedication }] = useSavePrescriptionMedicationMutation();

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
        if (prescriptions?.object) {
            const foundPrescription = prescriptions.object.find(prescription => {

                return prescription.saveDraft === true;
            });

            if (foundPrescription?.key != null) {
                setPreKey(foundPrescription?.key);

            }

        }

    }, [prescriptions]);

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
        if (preKey == null) {
            handleCleare()
        }

    }, [preKey]);
    
    useEffect(() => {
        if (showCanceled) {
            handleCleare();
        }
    }, [showCanceled])

    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleCancle = async () => {
        try {
            await Promise.all(
                selectedRows.map(item => savePrescriptionMedication({ ...item, isValid: false, statusLkey: "1804447528780744", deletedAt: Date.now() }).unwrap())
            );

            dispatch(notify({msg:'All Medication Deleted Successfully',sev:"success"}));
            setOpenCancellation(false);
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
            await handleCleare();
            setPreKey(null)
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

        setCustomeinst({ dose: null, frequency: null, unit: null, roa: null });


    }

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
                dispatch(notify({ msg: 'Draft Cancelled', sev: "success" }));
                setIsDraft(false);
            })
        } catch (error) { }

    }
    const handleSavePrescription = async () => {
        await handleCleare();
        setPreKey(null);


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

                preRefetch().then(() => "");

            } catch (error) {
                console.error("Error saving prescription:", error);
            }
        } else {
            console.warn("Patient or encounter is missing. Cannot save prescription.");
        }
    };

    const tableColumns = [
        {
            key: "#",
            title: <Translate> #</Translate>,
            flexGrow: 1,

            render: (rowData: any) => {
                return (
                    <Checkbox
                        className='check-box'
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
            title: <Translate> Medication Name</Translate>,
            flexGrow: 2,
            render: (rowData: any) => {
                return genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName;
            }
        },
        {
            key: 'instructions',
            dataKey: '',
            title: 'Instructions',
            flexGrow: 3,
            render: (rowData: any) => {
                if (rowData.instructionsTypeLkey === "3010591042600262") {
                    const generic = predefinedInstructionsListResponse?.object?.find(
                        item => item.key === rowData.instructions
                    );

                    if (generic) {

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
            key: 'edit',
            title: <Translate>Edit</Translate>,
            flexGrow: 1,
            render: rowData => {
                return (<MdModeEdit
                    title="Edit"
                    size={24}
                    style={{

                        color: (rowData.statusLvalue?.lovDisplayVale !== 'New') ? 'gray' : 'inherit',
                        cursor: (rowData.statusLvalue?.lovDisplayVale !== 'New') ? 'not-allowed' : 'pointer',
                    }}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        if (rowData.statusLvalue?.lovDisplayVale == 'New') {
                            setOpenDetailsModal(true)
                            setOpenToAdd(false);

                        }
                    }}
                />)
            }

        },
        ,
        {
            key: "",
            title: <Translate>Created At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.createdBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.createdAt)}</span>
                </>)
            }

        },
        {
            key: "",
            title: <Translate>Updated At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.updatedBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.updatedAt )}</span>
                </>)
            }

        },

        {
            key: "",
            title: <Translate>Cancelled At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.deletedBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.deletedAt)}</span>
                </>)
            }

        },

    ];
    return (
        < >
            <div className="bt-div" >
                <div style={{ width: '500px' }}>
                    <SelectPicker
                        className='fill-width'
                        data={filteredPrescriptions ?? []}
                        labelKey="prescriptionId"
                        valueKey="key"
                        placeholder="Prescription"
                        value={preKey ?? null}
                        onChange={e => {

                            setPreKey(e);
                        }}

                    />

                </div>


                <div className={`bt-right ${edit ? "disabled-panel" : ""}`}>
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

            <div className='bt-div'>
                <div className='icon-style'>
                    <FaFilePrescription size={18} />
                </div>
                <div>
                    <div className='prescripton-word-style'>Prescription</div>
                    <div className='prescripton-number-style'>
                        {prescriptions?.object?.find(prescription =>
                            prescription.key === preKey
                        )?.prescriptionId || "_"}
                    </div>
                </div>
                <div className='bt-right'>
                    <MyButton
                        disabled={!edit ? preKey ?
                            prescriptions?.object?.find(pre =>
                                pre.key === preKey
                            )?.statusLkey === '1804482322306061' : true : true
                        }
                        prefixIcon={() => <PlusIcon />}
                        onClick={() => {
                            setOpenDetailsModal(true)
                            setOpenToAdd(true);
                        }}

                    >
                        Add Medication
                    </MyButton>
                    <MyButton
                        prefixIcon={() => <BlockIcon />}
                        onClick={()=>setOpenCancellation(true)}
                        disabled={selectedRows.length === 0}
                    >
                        Cancle
                    </MyButton>

                    <Checkbox
                        checked={!showCanceled}
                        onChange={() => {
                            setShowCanceled(!showCanceled);
                        }}
                    >
                        Show cancelled
                    </Checkbox>
                </div>
            </div>

            <MyTable
                columns={tableColumns}
                data={prescriptionMedications?.object ?? []}
                onRowClick={rowData => {
                    setPrescriptionMedications(rowData);
                    setOpenToAdd(false);
                    if (rowData.instructionsTypeLkey == "3010606785535008") {

                        setSelectedRowoMedicationKey(rowData.key);
                    }

                }}
                loading={isLoadingPrescriptionMedications}
                rowClassName={isSelected}
            ></MyTable>


            <DetailsModal
                edit={edit}
                open={openDetailsModal} setOpen={setOpenDetailsModal}
                patient={patient}
                encounter={encounter}
                prescriptionMedication={prescriptionMedication}
                setPrescriptionMedications={setPrescriptionMedications}
                preKey={preKey}
                openToAdd={openToAdd}
                medicRefetch={medicRefetch}
            />
            <CancellationModal
                open={openCancellation}
                setOpen={setOpenCancellation}
                object={prescriptionMedication}
                setObject={setPrescriptionMedications}
                handleCancle={handleCancle}
                withReason={false}
                title={'Cancellation'}
            ></CancellationModal>

        </>

    );
}


export default Prescription;
