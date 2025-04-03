import { useState, useEffect, useRef } from 'react';
import Translate from '@/components/Translate';
import {
    faHandDots,
    faTriangleExclamation
    ,
    faIdCard,
    faUser,
    faFileWaveform


} from '@fortawesome/free-solid-svg-icons';
import { useGetEncountersQuery } from '@/services/encounterService';
import {
    useGetAllergiesQuery,
    useSaveAllergiesMutation,
    useGetWarningsQuery
} from '@/services/observationService';
import React from 'react';
import {
    Button,
    Panel,
    Row,
    Avatar,
    Text,
    Col,
    Divider

} from 'rsuite';
import {
    useUploadMutation,
    useFetchAttachmentQuery,
} from '@/services/attachmentService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaWeight, FaRulerVertical, FaUserCircle, FaDumbbell, FaUserAlt, FaTint, FaMars, FaVenus, FaUserNinja, FaCalendar } from 'react-icons/fa';
import { calculateAgeFormat } from '@/utils';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import { initialListRequest, ListRequest } from '@/types/types';
import { newApEncounter } from '@/types/model-types-constructor';
import { ApAttachment } from '@/types/model-types';
import './styles.less'
const PatientSide = ({ patient, encounter }) => {
    const [openAllargyModal, setOpenAllargyModal] = useState(false);
    const [openWarningModal, setOpenWarningModal] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const profileImageFileInputRef = useRef(null);
    const [upload, uploadMutation] = useUploadMutation();
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
    const [showCanceled, setShowCanceled] = useState(true);

    const filters = [
        {
            fieldName: 'patient_key',
            operator: 'match',
            value: patient?.key || undefined
        },
        {
            fieldName: "status_lkey",
            operator: showCanceled ? "notMatch" : "match",
            value: "3196709905099521",
        }
    ];


    const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({ ...initialListRequest, filters });
    const { data: warningsListResponse, refetch: fetchwarning } = useGetWarningsQuery({ ...initialListRequest, filters });
    const { data: patirntObservationlist } = useGetObservationSummariesQuery({
        ...initialListRequest,
        sortBy: 'createdAt',
        sortType: 'desc',
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key ?? undefined,
            }

        ],

    });
    const [bodyMeasurements, setBodyMeasurements] = useState({
        height: null,
        weight: null,
        headcircumference: null
    });
    const fetchPatientImageResponse = useFetchAttachmentQuery(
        {
            type: 'PATIENT_PROFILE_PICTURE',
            refKey: patient?.key,
        },
        { skip: !patient?.key }
    );

    useEffect(() => {
        setBodyMeasurements({
            height: patirntObservationlist?.object?.find((item) => item.latestheight != null)?.latestheight,
            weight: patirntObservationlist?.object?.find((item) => item.latestweight != null)?.latestweight,
            headcircumference: patirntObservationlist?.object?.find((item) => item.latestheadcircumference != null)?.latestheadcircumference
        })
    }, [patirntObservationlist]);

    useEffect(() => {
        if (
            fetchPatientImageResponse.isSuccess &&
            fetchPatientImageResponse.data &&
            fetchPatientImageResponse.data.key
        ) {
            setPatientImage(fetchPatientImageResponse.data);
        } else {
            setPatientImage(undefined);
        }
    }, [fetchPatientImageResponse]);
    const handleImageClick = type => {
        // setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE
        if (patient.key) profileImageFileInputRef.current.click();
    };
    return (
        <Panel style={{ width: '272px', padding: '7px', display: 'flex', flexDirection: 'column' }}>
            <div className='div-avatar' style={{ display: 'flex', flexDirection: 'row', gap: '15px', marginBottom: '10px' }}>
                <Avatar

                    circle
                    bordered
                    onClick={() => handleImageClick('PATIENT_PROFILE_PICTURE')}
                    src={
                        patientImage && patientImage.fileContent
                            ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
                            : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                    }
                    alt={patient?.fullName}
                />
                <div>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <Text style={{ fontSize: '12px', fontFamily: 'Manrope Medium' }}>{patient?.fullName ?? "Patient Name"}</Text>


                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        #  {patient?.patientMrn ?? "MRN"}

                    </div>
                </div>

            </div>

            <Text style={{ marginTop: '5px' }}>
                <FontAwesomeIcon icon={faIdCard} style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Document  Information</span>
            </Text>
            <br />

            <div style={{ display: 'flex', gap: '10px', width: '230px' ,height:'35px' }}>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Document No</Text>
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                        {patient?.documentTypeLvalue?.lovDisplayVale}
                    </Text>

                </div>

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                >
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Document Type</Text>
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                    > {patient?.documentNo}</Text>

                </div>
            </div>
            <Divider style={{ margin: '4px 4px' }} />

            <Text >
                <FontAwesomeIcon icon={faUser} style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Patient  Information</span>
            </Text>
            <br />

            <div style={{ display: 'flex', gap: '10px', width: '230px',height:'35px' }}>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Age</Text>
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                        {patient?.dob ? calculateAgeFormat(patient?.dob) : ""}
                    </Text>

                </div>

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                >
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Sex at Birth</Text>
                    <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                    > {patient?.genderLvalue?.lovDisplayVale}</Text>

                </div>


            </div>
            <Divider style={{ margin: '4px 4px' }} />
            <Text >
                <FaWeight style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Physical Measurements</span>
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <br />
                <div style={{ display: 'flex', gap: '10px', width: '230px' }}>
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Weight</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                            {bodyMeasurements?.weight}
                        </Text>

                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                    >
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Height</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                        > {bodyMeasurements?.height}</Text>

                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: '230px' }}>
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>H.C</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                            {bodyMeasurements?.headcircumference}
                        </Text>

                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                    >
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>BMI</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                        > {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2)}</Text>

                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: '230px' }}>
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>BSA</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                            {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2)}
                        </Text>

                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                    >
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Blood Group</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                        > B+</Text>

                    </div>
                </div>
            </div>
            <Divider style={{ margin: '4px 4px' }} />
            
            <Text >
            <FontAwesomeIcon icon={faFileWaveform}  style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Visit Details</span>
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <br />
                <div style={{ display: 'flex', gap: '10px', width: '230px',height:'35px' }}>
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Visit Date</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                            {encounter.plannedStartDate}
                        </Text>

                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                    >
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Visit ID</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                        > {encounter.visitId}</Text>

                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: '230px',height:'35px' }}>
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Visit Type</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                            {encounter?.visitTypeLvalue?.lovDisplayVale}
                        </Text>

                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                    >
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Priority</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                        > {encounter?.encounterPriorityLvalue?.lovDisplayVale}</Text>

                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: '230px',height:'35px' }}>
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Reason</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}>
                            {encounter?.reasonLvalue?.lovDisplayVale}
                        </Text>

                    </div>

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
                    >
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '12px', color: 'var(--icon-gray)' }}>Origin</Text>
                        <Text style={{ fontFamily: 'Manrope Medium', fontSize: '14px', color: 'var(--black)' }}
                        > {encounter.admissionOrigin}</Text>

                    </div>
                </div>
            </div>
            {/* <Row >
                <span style={{ fontWeight: 'bold' }}> Diagnosis:</span> {encounter?.diagnosis}

            </Row> */}

        </Panel>
    )
}
export default PatientSide;