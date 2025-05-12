import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
    useGetDrugOrderMedicationQuery,
    useGetDrugOrderQuery,
    useSaveDrugOrderMedicationMutation,
    useSaveDrugOrderMutation,
} from '@/services/encounterService';
import {
    useGetGenericMedicationWithActiveIngredientQuery
} from '@/services/medicationsSetupService';
import { FaPills } from "react-icons/fa";
import { newApDrugOrder, newApDrugOrderMedications } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import DocPassIcon from '@rsuite/icons/DocPass';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import {
    Checkbox,
    Divider,
    SelectPicker,
    Table,
    Text
} from 'rsuite';
import DetailsModal from './DetailsModal';
import './styles.less';
const { Column, HeaderCell, Cell } = Table;
const DrugOrder = ({ edit, patient, encounter }) => {

    const dispatch = useAppDispatch();
    const [drugKey, setDrugKey] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showCanceled, setShowCanceled] = useState(true);
    const [editing, setEditing] = useState(false);
    const [selectedGeneric, setSelectedGeneric] = useState(null);
    const [isdraft, setIsDraft] = useState(false);

    const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
    const [openDetailsModel, setOpenDetailsModel] = useState(false);
    const { data: genericMedicationListResponse } = useGetGenericMedicationWithActiveIngredientQuery(searchKeyword);

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
    const [orderMedication, setOrderMedication] = useState<any>(
        {
            ...newApDrugOrderMedications,
            drugOrderKey: drugKey,


        });
    const [saveDrugorder, saveDrugorderMutation] = useSaveDrugOrderMutation();
    const [saveDrugorderMedication, saveDrugorderMedicationMutation] = useSaveDrugOrderMedicationMutation();

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
    const filteredorders = orders?.object?.filter(
        (item) => item.statusLkey === "1804482322306061"
    ) ?? [];



    const isSelected = rowData => {
        if (rowData && orderMedication && rowData.key === orderMedication.key) {
            return 'selected-row';
        } else return '';
    };

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


    const saveDraft = async () => {
        try {
            await saveDrugorder({
                ...orders?.object?.find(order =>
                    order.key === drugKey
                ),
                saveDraft: true
            }).then(() => {
                dispatch(notify({ msg: 'Saved Draft successfully', type: 'success' }));
                setIsDraft(true);
            })
        } catch (error) {
            dispatch(notify({ msg: 'Error Saving draft', type: 'error' }));

        }

    }
    const cancleDraft = async () => {
        try {
            await saveDrugorder({
                ...orders?.object?.find(order =>
                    order.key === drugKey
                ),
                saveDraft: false
            }).then(() => {
                dispatch(notify({ msg: 'Draft Cancelled', sev: 'info' }));
                setIsDraft(false);
            })
        } catch (error) { }

    }


    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
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
            dispatch(notify({ mag: "Patient or encounter is missing. Cannot save order.", sev: "warning" }));
        }
    };
    const handleCancle = async () => {


        try {
            await
                saveDrugorderMedication({ ...orderMedication, statusLkey: "1804447528780744", deletedAt: Date.now() }).unwrap();


            dispatch(notify({ msg: ' medication deleted successfully', type: 'success' }));
            CloseCancellationReasonModel();
            medicRefetch().then(() => {
                console.log("Refetch complete");
            }).catch((error) => {
                console.error("Refetch failed:", error);
            });

        } catch (error) {

            dispatch(notify({ msg: ' deleted failed', sev: 'error' }));

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
            dispatch(notify({ msg: 'Submetid  Successfully', sev: 'success' }));
            await handleCleare();
            setDrugKey(null)

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
        setSelectedGeneric(null)

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
            key: 'edit',
            title: <Translate>Edit</Translate>,
            flexGrow: 1,
            render: rowData => {
                return (<MdModeEdit
                    title="Edit"
                    size={24}

                    fill="var(--primary-gray)"
                    onClick={() => { setOpenDetailsModel(true) }}
                />)
            }

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
            expandable: true,
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
    return (<>

        <div className='bt-div'

        >
            <div style={{ width: '500px' }}>
                <SelectPicker

                    className='fill-width'
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

            <div className={`bt-right ${edit ? "disabled-panel" : ""}`}>

                <MyButton
                    prefixIcon={() => <PlusIcon />}
                    onClick={handleSaveOrder}
                    disabled={isdraft}
                >New Order</MyButton>
                <MyButton
                    prefixIcon={() => <CheckIcon />}
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
                        prefixIcon={() => <DocPassIcon />}
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
                        prefixIcon={() => <DocPassIcon />}
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

        <Divider />



        <div className='mid-container-p '>
            <div className='bt-div'>
                <div className='icon-style'>
                    <FaPills size={18} />
                </div>
                <div>
                    <div className='prescripton-word-style'>Order</div>
                    <div className='prescripton-number-style'>
                        {orders?.object?.find(order =>
                            order.key === drugKey
                        )?.drugorderId || "_"}
                    </div>
                </div>

                <div className='bt-right'>
                    <MyButton
                        disabled={!edit ? drugKey ?
                            orders?.object?.find(order =>
                                order.key === drugKey
                            )?.statusLkey === '1804482322306061' : true : true
                        }
                        prefixIcon={() => <PlusIcon />}
                        onClick={() => {
                            setOpenDetailsModel(true)
                            handleCleare()
                        }}
                    >Add Medication</MyButton>
                    <MyButton

                        prefixIcon={() => <BlockIcon />}
                        onClick={() => setOpenCancellationReasonModel(true)}
                        disabled={orderMedication.statusLvalue?.lovDisplayVale !== 'New'}
                    >
                        <Translate> Cancle</Translate>
                    </MyButton>

                    <Checkbox
                        checked={!showCanceled}
                        onChange={() => {


                            setShowCanceled(!showCanceled);
                        }}
                    >
                        Show canceled orders
                    </Checkbox>
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
                rowClassName={isSelected}

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
                edit={edit}
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