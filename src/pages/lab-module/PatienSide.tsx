import { useState, useEffect, useRef } from 'react';
import Translate from '@/components/Translate';
import {
    faHandDots,
    faTriangleExclamation
    , faClipboardList,
    faComment
    ,
    faPrint
    ,
    faComments,
    faVialCircleCheck,
    faDiagramPredecessor,
    faFilter,
    faStar,
    faLandMineOn,
    faIdCard,
    faUserNinja,
    faPaperPlane,
    faCalendar

} from '@fortawesome/free-solid-svg-icons';
import { useGetEncountersQuery } from '@/services/encounterService';
import {
    useGetAllergiesQuery,
    useSaveAllergiesMutation,
    useGetWarningsQuery
  } from '@/services/observationService';
import React from 'react';
import {
    InputGroup,
    Button,
    Form,
    IconButton,
    Input,
    Divider,
    Drawer,
    Panel,
    Pagination,
    Row,
    Avatar,
    DatePicker,
    Dropdown,
    Text,
    Modal,
    Col

} from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaWeight, FaRulerVertical, FaUserCircle, FaDumbbell, FaUserAlt, FaTint, FaMars, FaVenus, FaUserNinja, FaCalendar } from 'react-icons/fa';
import { calculateAgeFormat } from '@/utils';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import { initialListRequest, ListRequest } from '@/types/types';
import { newApEncounter } from '@/types/model-types-constructor';
const PatientSide = ({ patient, encounter}) => {
   const [openAllargyModal, setOpenAllargyModal] = useState(false);
     const [openWarningModal, setOpenWarningModal] = useState(false);
     const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
     const [showCanceled, setShowCanceled] = useState(true);
   
     const filters = [
       {
         fieldName: 'patient_key',
         operator: 'match',
         value:patient?.key||undefined
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
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest
        
    });


    useEffect(() => {
        setBodyMeasurements({
            height: patirntObservationlist?.object?.find((item) => item.latestheight != null)?.latestheight,
            weight: patirntObservationlist?.object?.find((item) => item.latestweight != null)?.latestweight,
            headcircumference: patirntObservationlist?.object?.find((item) => item.latestheadcircumference != null)?.latestheadcircumference
        })
    }, [patirntObservationlist])
    return (<>
        <Row style={{ alignItems: 'center', marginTop: '4px' }}>
            <Col xs={6}>
                <Avatar src="https://i.pravatar.cc/150?u=2" circle size="lg" />
            </Col>
            <Col style={{ flexGrow: 1, marginLeft: 10, marginTop: '10px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <Text style={{ fontSize: '12px' }}>{patient?.fullName ?? "Patient Name"}</Text>
                    {patient?.genderLkey == '1' && <FaMars style={{ marginLeft: 8, color: '#007bff' }} />}
                    {patient?.genderLkey == '2' && <FaVenus style={{ marginLeft: 8, color: '#fccfcf' }} />}

                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                    {patient?.patientMrn ?? "MRN"}-  {patient?.dob ? calculateAgeFormat(patient?.dob) + '' : 'Age'}
                </div>
            </Col>
        </Row>

        <Row style={{ paddingLeft: '14px' }}>
            <Col><FontAwesomeIcon icon={faIdCard} /></Col>
            <Col>
                {patient?.documentTypeLvalue?.lovDisplayVale ?? "Document "}
            </Col>
            <Col>
                {patient?.documentNo ?? "Number"}
            </ Col>

        </Row>
        <Row style={{ paddingLeft: '14px' }}>
          <span style={{fontWeight:'bold'}}> Diagnosis:</span> {encounter?.diagnosis}

        </Row>
        <Row style={{ paddingLeft: '14px' }}>
            <Col xs={10}>
                <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                    <FaWeight size={15} color="#00b1cc" /> <br />
                    <strong>{bodyMeasurements?.weight ?? 'Weight'}</strong>
                </Panel>
            </Col>
            <Col xs={10}>
                <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                    <FaRulerVertical size={15} color="#00b1cc" /> <br />
                    <strong>{bodyMeasurements?.height ?? 'Height'}</strong>
                </Panel>
            </Col>
        </Row>
        <Row style={{ paddingLeft: '14px' }}>
            <Col xs={10}>
                <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                    <FaUserNinja size={15} color="#00b1cc" />
                    <br />
                    <strong>{bodyMeasurements?.headcircumference ?? 'H.C'}</strong>
                </Panel>
            </Col>
            <Col xs={10}>
                <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                    <FaTint size={15} color="red" /> <br />
                    A
                </Panel>

            </Col>

        </Row>
        <Row style={{ paddingLeft: '14px' }}>
            <Col xs={10}>
                <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>

                    <strong>BSA:</strong> {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2) ?? ""}
                </Panel>
            </Col>
            <Col xs={10}>
                <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>

                    <strong>BMI:</strong> {(bodyMeasurements?.weight / ((bodyMeasurements?.height / 100) ** 2)).toFixed(2) ?? ""}

                </Panel>
            </Col>

        </Row>

        <Row style={{ paddingLeft: '14px' }}>
            <Col xs={10}>
                <Button appearance="primary"
                    // onClick={OpenWarningModal}
                    style={{ backgroundColor: "#00b1cc", borderColor: "#00b1cc", color: "white" }}

                >
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    <Translate>Warning</Translate>
                </Button>
            </Col>
            <Col xs={10}>
                <Button appearance="primary"
                    // onClick={OpenAllargyModal}
                     color={patient?.hasAllergy ? "red" : "cyan"} 
                    style={{ backgroundColor: "#00b1cc", borderColor: "#00b1cc", color: "white" }}
                >
                    <FontAwesomeIcon icon={faHandDots} />
                    <Translate>Allergy</Translate>
                </Button>
            </Col>
        </Row>
    </>)
}
export default PatientSide;