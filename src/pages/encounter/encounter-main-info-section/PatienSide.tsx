import { useState, useEffect, useRef } from 'react';
import {
    faIdCard,
    faUser,
    faFileWaveform
} from '@fortawesome/free-solid-svg-icons';
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
    useFetchAttachmentQuery,
} from '@/services/attachmentService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaWeight } from 'react-icons/fa';
import { calculateAgeFormat } from '@/utils';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import { initialListRequest, ListRequest } from '@/types/types';
import { newApEncounter } from '@/types/model-types-constructor';
import { ApAttachment } from '@/types/model-types';
import './styles.less'
import { GiMedicalThermometer } from 'react-icons/gi';
const PatientSide = ({ patient, encounter }) => {
    const profileImageFileInputRef = useRef(null);
    const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
    console.log("EEE", encounter?.resourceTypeLvalue?.valueCode)


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
            height: patirntObservationlist?.object?.find((item) => item.latestheight != null && item.latestheight != 0)?.latestheight,
            weight: patirntObservationlist?.object?.find((item) => item.latestweight != null && item.latestheight != 0)?.latestweight,
            headcircumference: patirntObservationlist?.object?.find((item) => item.latestheadcircumference != null && item.latestheight != 0)?.latestheadcircumference
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
        <Panel className='patient-panel'>
            <div className='div-avatar' >
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
                    <div className='patient-info'>
                        <Text className='patient-name'>{patient?.fullName ?? "Patient Name"}</Text>


                    </div>
                    <div className='info-label'>
                        #  {patient?.patientMrn ?? "MRN"}

                    </div>
                </div>

            </div>

            <Text >
                <FontAwesomeIcon icon={faIdCard} className='icon-color' /> <span className='section-title'>Document  Information</span>
            </Text>
            <br />


            <div className='info-section'>
                <div className='info-column'>
                    <Text className='info-label'>Document Type</Text>
                    <Text className='info-value'>

                        {patient?.documentTypeLvalue?.lovDisplayVale}
                    </Text>

                </div>

                <div className='info-column'
                >
                    <Text className='info-label'>Document No</Text>
                    <Text className='info-value'
                    > {patient?.documentNo}</Text>

                </div>
            </div>
            <Divider className='divider-style' />

            <Text >
                <FontAwesomeIcon icon={faUser} className='icon-color' /> <span className='section-title'>Patient  Information</span>
            </Text>
            <br />

            <div className='info-section'>
                <div className='info-column'>
                    <Text className='info-label'>Age</Text>
                    <Text className='info-value'>

                        {patient?.dob ? calculateAgeFormat(patient?.dob) : ""}
                    </Text>

                </div>

                <div className='info-column'
                >
                    <Text className='info-label'>Sex at Birth</Text>
                    <Text className='info-value'
                    > {patient?.genderLvalue?.lovDisplayVale}</Text>

                </div>


            </div>
            <Divider className='divider-style' />
            <Text >
                <FaWeight className='icon-color' /> <span className='section-title'>Physical Measurements</span>
            </Text>
            <div className='details-section'>
                <br />
                <div className='info-section'>
                    <div className='info-column'>
                        <Text className='info-label'>Weight</Text>
                        <Text className='info-value'>
                            {bodyMeasurements?.weight}
                        </Text>

                    </div>

                    <div className='info-column'
                    >
                        <Text className='info-label'>Height</Text>
                        <Text className='info-value'
                        > {bodyMeasurements?.height}</Text>

                    </div>
                </div>
                <div className='info-section'>
                    <div className='info-column'>
                        <Text className='info-label'>H.C</Text>
                        <Text className='info-value'>
                            {bodyMeasurements?.headcircumference}
                        </Text>

                    </div>

                    <div className='info-column'
                    >
                        <Text className='info-label'>BMI</Text>
                        <Text className='info-value'
                        > {(bodyMeasurements?.weight / ((bodyMeasurements?.height / 100) ** 2)).toFixed(2)}</Text>

                    </div>
                </div>
                <div className='info-section'>
                    <div className='info-column'>
                        <Text className='info-label'>BSA</Text>
                        <Text className='info-value'>

                            {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2)}
                        </Text>

                    </div>

                    <div className='info-column'
                    >
                        <Text className='info-label'>Blood Group</Text>
                        <Text className='info-value'
                        >{patient?.bloodGroupLvalue?.lovDisplayVale ?? "Nan"}</Text>

                    </div>
                </div>
            </div>
            <Divider className='divider-style' />

            <Text >
                <FontAwesomeIcon icon={faFileWaveform} className='icon-color' /> <span className='section-title'>{encounter?.resourceTypeLvalue?.valueCode !== "BRT_INPATIENT"?"Visit Details":"Admission Details"}</span>
            </Text>
            {encounter?.resourceTypeLvalue?.valueCode !== "BRT_INPATIENT" &&
                <div className='details-section'>
                    <br />

                    <div className='info-section'>
                        <div className='info-column'>
                            <Text className='info-label'>Visit Date</Text>
                            <Text className='info-value'>

                                {encounter?.plannedStartDate}
                            </Text>

                        </div>

                        <div className='info-column'
                        >
                            <Text className='info-label'>Visit ID</Text>
                            <Text className='info-value'
                            > {encounter?.visitId}</Text>

                        </div>
                    </div>

                    <div className='info-section'>
                        <div className='info-column'>
                            <Text className='info-label'>Visit Type</Text>
                            <Text className='info-value'>

                                {encounter?.visitTypeLvalue?.lovDisplayVale}
                            </Text>

                        </div>

                        <div className='info-column'
                        >
                            <Text className='info-label'>Priority</Text>
                            <Text className='info-value'
                            > {encounter?.encounterPriorityLvalue?.lovDisplayVale}</Text>

                        </div>
                    </div>

                    <div className='info-section'>
                        <div className='info-column'>
                            <Text className='info-label'>Reason</Text>
                            <Text className='info-value'>

                                {encounter?.reasonLvalue?.lovDisplayVale}
                            </Text>

                        </div>

                        <div className='info-column'
                        >
                            <Text className='info-label'>Origin</Text>
                            <Text className='info-value'
                            > {encounter?.originLvalue?.lovDisplayVale}</Text>

                        </div>
                    </div>



                </div>}

            {encounter?.resourceTypeLvalue?.valueCode === "BRT_INPATIENT" && (
                <>
                    <div className="details-section">
                        <div className="info-section">
                            <div className="info-column">
                                <Text className="info-label">Room</Text>
                                <Text className="info-value">{encounter?.apRoom?.name}</Text>
                            </div>

                            <div className="info-column">
                                <Text className="info-label">Bed</Text>
                                <Text className="info-value">{encounter?.apBed?.name}</Text>
                            </div>
                        </div>

                        <div className="info-section">
                            <div className="info-column">
                                <Text className="info-label">Ward</Text>
                                <Text className="info-value">{encounter?.departmentName}</Text>
                            </div>

                            <div className="info-column">
                                <Text className="info-label">Date of Admission</Text>
                                <Text className="info-value">{encounter?.actualStartDate}</Text>
                            </div>
                        </div>
                    </div>

                    <Divider className="divider-thin" />

                    <Text>
                        <GiMedicalThermometer className="icon-title" />
                        <span className="patient-section-title">Diagnosis</span>
                    </Text>

                    <div style={{ marginTop: 8 }}>
                        <Text>{encounter?.diagnosis}</Text>
                    </div>
                </>
            )}

        </Panel>
    )
}
export default PatientSide;