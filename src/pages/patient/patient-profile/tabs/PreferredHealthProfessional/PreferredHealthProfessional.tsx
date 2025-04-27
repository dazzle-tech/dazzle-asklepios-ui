import React, { useEffect, useState } from 'react';
import '../styles.less';
import Translate from '@/components/Translate';
import { PlusRound } from '@rsuite/icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { newApPractitioner, newApPatientPreferredHealthProfessional } from '@/types/model-types-constructor';
import { ApPractitioner, ApPatientPreferredHealthProfessional } from '@/types/model-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import { useSavePatientPreferredHealthProfessionalMutation, useGetPatientPreferredHealthProfessionalQuery, useDeletePatientPreferredHealthProfessionalMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddPrefferdHealthProfessionalModal from './AddPrefferdHealthProfessionalModal';
const PreferredHealthProfessional = ({ patient, isClick }) => {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [patientHP, setPatientHP] = useState<ApPatientPreferredHealthProfessional>({ ...newApPatientPreferredHealthProfessional })
    const [practitioner, setPractitioner] = useState<ApPractitioner>({ ...newApPractitioner });
    const [deletePreferredHealthModalOpen, setDeletePreferredHealthModalOpen] = useState(false);
    const [deletePatientPH] = useDeletePatientPreferredHealthProfessionalMutation();
    const [editable, setEditable] = useState(false);
    //Table Content Column
    const columns = [
        {
            key: 'nameOfHP',
            title: <Translate>Name of the HP</Translate>,
            flexGrow: 4,
            render: (rowData: any) => rowData?.practitioner?.practitionerFullName || ' ',
        },
        {
            key: 'speciality',
            title: <Translate>Speciality</Translate>,
            flexGrow: 4,
            render: (rowData: any) =>
                rowData?.practitioner?.specialtyLvalue
                    ? rowData?.practitioner?.specialtyLvalue?.lovDisplayVale
                    : rowData?.specialtyLkey,
        },
        {
            key: 'telephoneNo',
            title: <Translate>Telephone no.</Translate>,
            flexGrow: 4,
            render: (rowData: any) => rowData?.practitioner?.practitionerPhoneNumber || ' ',
        },
        {
            key: 'email',
            title: <Translate>Email</Translate>,
            flexGrow: 4,
            render: (rowData: any) => rowData?.practitioner?.practitionerEmail || ' ',
        },
        {
            key: 'hpOrganization',
            title: <Translate>HP Organization</Translate>,
            flexGrow: 4,
            render: (rowData: any) => rowData?.facility?.facilityName || ' ',
        },
        {
            key: 'networkAffiliation',
            title: <Translate>Network Affiliation</Translate>,
            flexGrow: 4,
            dataKey: 'networkAffiliation',
        },
        {
            key: 'relatedWith',
            title: <Translate>Related with</Translate>,
            flexGrow: 4,
            dataKey: 'relatedWith',
        },
    ];

    // Function to check if the current row is the selected one
    const isSelected = rowData => {
        if (rowData && patientHP && patientHP.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };

    // Initialize patient preferred health professional list request with default filters
    const [patientPreferredHealthProfessional, setPatientPreferredHealthProfessional] = useState<ListRequest>({
        ...initialListRequest,
        pageSize: 1000,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ]
    });
    // Fetch patient preferred health professional data
    const { data: patientPreferredHealthProfessionalResponse, refetch: patientPreferredHealthProfessionalRefetch } =
        useGetPatientPreferredHealthProfessionalQuery(patientPreferredHealthProfessional, { skip: !patient.key });

    // Handle adding a new preferred health professional
    const handleNewPreferredHP = () => {
        setPatientHP({ ...newApPatientPreferredHealthProfessional });
        setPractitioner({ ...newApPractitioner });
        setOpen(true);
    };
    // Handle clearing and closing delete and preferred health professional modals
    const handleClearDeletePH = () => {
        setPatientHP({ ...newApPatientPreferredHealthProfessional });
        setPractitioner({ ...newApPractitioner });
        setDeletePreferredHealthModalOpen(false);
    };
    // Handle deleting a preferred health professional
    const handleDeletePH = () => {
        deletePatientPH({ ...patientHP }).unwrap().then(() => {
            dispatch(notify('Preferred Health Professional Deleted Successfully'));
            patientPreferredHealthProfessionalRefetch();
        })
        handleClearDeletePH();
    };

    // Effects
    useEffect(() => {
        setPatientPreferredHealthProfessional((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key,
                        }
                    ]
                    : []),
            ],
        }));
    }, [patient]);
    return (
        <div className="tab-main-container">
            <div className="tab-content-btns">
                <AddPrefferdHealthProfessionalModal open={open} setOpen={setOpen} patient={patient} patientHP={patientHP} setPatientHP={setPatientHP} refetch={patientPreferredHealthProfessionalRefetch} practitioner={practitioner} setPractitioner={setPractitioner}/>
                <MyButton
                    onClick={handleNewPreferredHP}
                    disabled={isClick}
                    prefixIcon={() => <PlusRound />}>
                    New Preferred Health Professional
                </MyButton>
                <MyButton
                    disabled={isClick || !editable}
                    onClick={() => {
                        setOpen(true);
                    }}
                    prefixIcon={() => <FontAwesomeIcon icon={faUserPen} />}>
                    Edit
                </MyButton>
                <MyButton
                    disabled={isClick || !editable}
                    onClick={() => { setDeletePreferredHealthModalOpen(true) }}
                    prefixIcon={() => <FontAwesomeIcon icon={faTrash} />}>
                    Delete
                </MyButton>
            </div>
            <MyTable
                data={patientPreferredHealthProfessionalResponse?.object ?? []}
                columns={columns}
                onRowClick={rowData => {
                    setPatientHP(rowData);
                    setEditable(true);
                    setPractitioner(rowData?.practitioner);
                }}
                rowClassName={isSelected}
            />
            <DeletionConfirmationModal
                open={deletePreferredHealthModalOpen}
                setOpen={setDeletePreferredHealthModalOpen}
                itemToDelete='Record'
                actionButtonFunction={handleDeletePH}>
            </DeletionConfirmationModal>
        </div>
    );
};

export default PreferredHealthProfessional;
