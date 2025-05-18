import {
    useFetchAttachmentQuery,
} from '@/services/attachmentService';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import { initialListRequest } from '@/types/types';
import { calculateAgeFormat } from '@/utils';
import {
    faHandDots,
    faIdCard,
    faTriangleExclamation,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { FaWeight } from 'react-icons/fa';
import {
    Avatar,
    Divider,
    Panel,
    Table,
    Text
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

import MyButton from '@/components/MyButton/MyButton';
import { ApAttachment } from '@/types/model-types';
import AllergiesModal from '../encounter/encounter-screen/AllergiesModal';
import WarningiesModal from '../encounter/encounter-screen/WarningiesModal';
import './styles.less';
const PatientSide = ({ patient, encounter }) => {
    const [openAllargyModal, setOpenAllargyModal] = useState(false);
    const [openWarningModal, setOpenWarningModal] = useState(false);
    const profileImageFileInputRef = useRef(null);
    const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
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
      const OpenAllargyModal = () => {
        setOpenAllargyModal(true);
      }
      const OpenWarningModal = () => {
        setOpenWarningModal(true);
      }
 
    return (
        <Panel className="patient-panel">
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
                    <div className="patient-info">
                        <Text style={{ fontSize: '12px', fontFamily: 'Manrope Medium' }}>{patient?.fullName ?? "Patient Name"}</Text>


                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'Manrope Medium' }}>
                        #  {patient?.patientMrn ?? "MRN"}

                    </div>
                </div>

            </div>

            <Text style={{ marginTop: '5px' }}>
                <FontAwesomeIcon icon={faIdCard} style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Document  Information</span>
            </Text>
            <br />

            <div className='info-section'>
                <div className='info-column'>
                    <Text className='info-label'>Document No</Text>
                    <Text className='info-value'>
                        {patient?.documentTypeLvalue?.lovDisplayVale}
                    </Text>

                </div>

                <div className='info-column'
                >
                    <Text className='info-label'>Document Type</Text>
                    <Text className='info-value'
                    > {patient?.documentNo}</Text>

                </div>
            </div>
            <Divider style={{ margin: '4px 4px' }} />

            <Text >
                <FontAwesomeIcon icon={faUser} style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Patient  Information</span>
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
            <Divider style={{ margin: '4px 4px' }} />
            <Text >
                <FaWeight style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Physical Measurements</span>
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        > {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2)}</Text>

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
                        > {encounter?.bloodGroup??"NaN"}</Text>

                    </div>
                </div>
            </div>

            <Divider style={{ margin: '4px 4px' }} />
            <div className='info-section'>
                <MyButton
                    
                       onClick={OpenAllargyModal}
                    prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
                    backgroundColor={patient?.hasAllergy ? "var(--primary-orange)" : "var(--deep-blue)"}
                >Allergy</MyButton>
                <MyButton
                 
                 backgroundColor={patient?.hasWarning ? "var(--primary-orange)" : "var(--deep-blue)"}
                    onClick={OpenWarningModal}
                    prefixIcon={() => <FontAwesomeIcon icon={faTriangleExclamation} />}
                  >Warning</MyButton>
            </div>

           <WarningiesModal open={openWarningModal} setOpen={setOpenWarningModal} patient={patient}/>
          
            <AllergiesModal open={openAllargyModal} setOpen={setOpenAllargyModal} patient={patient}/>
        </Panel>
    )
}
export default PatientSide;