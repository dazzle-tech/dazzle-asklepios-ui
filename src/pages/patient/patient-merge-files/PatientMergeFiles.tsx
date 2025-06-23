import React, { useEffect, useRef, useState } from 'react';
import MyInput from '@/components/MyInput';
import {
    InputGroup,
    ButtonToolbar,
    Form,
    IconButton,
    Input,
    Panel,
    Stack,
    Divider,
    Drawer,
    Table,
    Pagination,
    Button,
    Modal,
    Whisper,
    Tooltip,
    SelectPicker,
    Badge,
    DatePicker,
    Grid,
    Row,
    Col,
    Container
} from 'rsuite';
import Translate from '@/components/Translate';
const { Column, HeaderCell, Cell } = Table;
import { Block, Icon, PlusRound } from '@rsuite/icons';
import {
    useFetchAttachmentQuery,
    useFetchAttachmentLightQuery,
    useUploadMutation,
} from '@/services/attachmentService';
import {
    newApPatient,
} from '@/types/model-types-constructor';
import { VscUnverified } from 'react-icons/vsc';
import { VscVerified } from 'react-icons/vsc';
import * as icons from '@rsuite/icons';
import ReloadIcon from '@rsuite/icons/Reload';
import SearchIcon from '@rsuite/icons/Search';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import {
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
    useGetPatientsQuery,
} from '@/services/patientService';
import { ApAttachment, ApPatient } from '@/types/model-types';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/hooks';
import ProfileSidebar from '../patient-profile/ProfileSidebar';
import { getHeight } from 'rsuite/esm/DOMHelper';
import ProfileHeader from '../patient-profile/ProfileHeader';
import clsx from 'clsx';
import ProfileTabs from '../patient-profile/ProfileTabs';
import InfoCardList from '@/components/InfoCardList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeMerge, faRepeat } from '@fortawesome/free-solid-svg-icons';
import MemberIcon from '@rsuite/icons/Member';
import MyButton from '@/components/MyButton/MyButton';
import PatientInfoCard from '@/components/PatientInfoCard'; 

const PatientMergeFiles = () => {

    const [expand, setExpand] = useState(false);
    const [windowHeight, setWindowHeight] = useState(getHeight(window));
    const [fromPatient, setFromPatient] = useState<ApPatient>({ ...newApPatient });
    const [fromPatientList, setFromPatientList] = useState<ApPatient[]>([{ ...newApPatient }]);
    const [toPatient, setToPatient] = useState<ApPatient>({ ...newApPatient });
    const [toPatientList, setToPatientList] = useState<ApPatient[]>([{ ...newApPatient }]);
    const [refetchData, setRefetchData] = useState(false);


    const dispatch = useAppDispatch();
    const divElement = useSelector((state: RootState) => state.div?.divElement);
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>Files Merge</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Files_Merge'));
    dispatch(setDivContent(divContentHTML));



    useEffect(() => {
        if (fromPatient.key) {
            setFromPatientList([fromPatient])
        }

    }, [fromPatient]);

    useEffect(() => {
        if (toPatient.key) {
            setToPatientList([toPatient])
        }

    }, [toPatient]);

    return (
        <>
            {/* <div style={{ padding: 20 }}>
          <Container style={{ width: '100%', padding: 0 }}>
      <Row style={{ width: '100%', margin: 0 }}>
        <Col xs={24} sm={5}>
        <ProfileSidebar
          expand={true}
          setExpand={setExpand}
          windowHeight={windowHeight}
          setLocalPatient={setFromPatient}
          refetchData={refetchData}
          setRefetchData={setRefetchData}
          title='From Patient'
        /> 
        </Col>
        <Col  xs={24} sm={2}>
        </Col>
        <Col xs={24} sm={12}>
        <InfoCardList
            list={fromPatientList || []}
            fields={[
                'patientName',
                'sexAndAge',
                'dateOfRegister',
                'documentType',
                'documentCountry',
                'documentNumber',
            ]}
            titleField="fromPatient"
            fieldLabels={{
                patientName: 'Patient Name',
                sexAndAge: 'Sex & Age',
                dateOfRegister: 'Date of Register',
                documentType: 'Document Type',
                documentCountry: 'Document Country',
                documentNumber: 'Document Number',
            }}
            computedFields={{
                patientName: (item) =>
                    (item?.firstName || '') + (item?.lastName || ''),
                sexAndAge: (item) =>   
                    (item?.genderLvalue?.lovDisplayValue|| '') + (item?.dob ? calculateAgeFormat(item.dob) + ''  : ''),
                dateOfRegister: (item) =>
                    (item?.strength || '') + (item?.unitLvalue?.lovDisplayVale || ''),
                documentType: (item) => 
                    (item?.documentTypeLvalue?.lovDisplayVale  || '') ,
                documentCountry: (item) =>
                    item?.documentCountryLvalue?.lovDisplayVale || " ",
                documentNumber: (item) => 
                    (item?.documentNo || '') ,
                
            }}
         
        />
         <div className="merge-controls" style={{ textAlign: "center", margin: "20px 0" }}>
                          <FontAwesomeIcon icon={faRepeat} style={{ fontSize: 100, transform: 'rotate(90deg)' }} />
                        </div>
          <InfoCardList
            list={toPatientList || []}
            fields={[
                'patientName',
                'sexAndAge',
                'dateOfRegister',
                'documentType',
                'documentCountry',
                'documentNumber',
            ]}
            titleField="toPatient"
            fieldLabels={{
                patientName: 'Patient Name',
                sexAndAge: 'Sex & Age',
                dateOfRegister: 'Date of Register',
                documentType: 'Document Type',
                documentCountry: 'Document Country',
                documentNumber: 'Document Number',
            }}
            computedFields={{
                patientName: (item) =>
                    (item?.firstName || '') + (item?.lastName || ''),
                sexAndAge: (item) =>   
                    (item?.genderLvalue?.lovDisplayValue|| '') + (item?.dob ? calculateAgeFormat(item.dob) + ''  : ''),
                dateOfRegister: (item) =>
                    (item?.strength || '') + (item?.unitLvalue?.lovDisplayVale || ''),
                documentType: (item) => 
                    (item?.documentTypeLvalue?.lovDisplayVale  || '') ,
                documentCountry: (item) =>
                    item?.documentCountryLvalue?.lovDisplayVale || " ",
                documentNumber: (item) => 
                    (item?.documentNo || '') ,
                
            }}
         
        />
        </Col>
        <Col xs={24} sm={2}>
        </Col>
        <Col xs={24} sm={4}>
        <ProfileSidebar
          expand={true}
          setExpand={setExpand}
          windowHeight={windowHeight}
          setLocalPatient={setToPatient}
          refetchData={refetchData}
          setRefetchData={setRefetchData}
          title='Merge To'
        /> 
        </Col>
      </Row>
    </Container>
    </div> */}
            <Grid fluid>
                <Row>
                    {/* Main Content */}
                    <Col xs={24}>
                        <Row>
                            <Col xs={5}>
                                <ProfileSidebar
                                    expand={true}
                                    setExpand={setExpand}
                                    windowHeight={windowHeight}
                                    setLocalPatient={setFromPatient}
                                    refetchData={refetchData}
                                    setRefetchData={setRefetchData}
                                    title='From Patient'
                                    direction='right'
                                    showButton= {false}
                                />

                            </Col>

                            {/* Merge Panel */}
                            <Col xs={14}>
                                <Panel bordered>
                                    <Panel bordered>
                                        <h6>From Patient</h6>
                                        <Panel bordered>
                                            <PatientInfoCard 
                                             patient={fromPatient}
                                            /> 
                                        </Panel>

                                    </Panel>

                                    <div className="merge-controls" style={{ textAlign: "center", margin: "20px 0" }}>
                                        <FontAwesomeIcon icon={faRepeat} style={{ fontSize: 100, transform: 'rotate(90deg)' }} />
                                    </div>
                                    <Panel bordered>
                                        <h6>Merge To</h6>
                                        <Panel bordered >
                                        <PatientInfoCard 
                                             patient={toPatient}
                                            /> 
                                        </Panel>
                                    </Panel>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                    <MyButton
                                        size="small"
                                        prefixIcon={() => <FontAwesomeIcon icon={faCodeMerge} />}
                                        appearance="primary"
                                    >
                                        Merge
                                    </MyButton>
                                    <MyButton
                                        size="small"
                                        prefixIcon={() => <icons.Reload />}
                                        appearance="subtle"
                                    >
                                        Undo
                                    </MyButton>
                                    </div>
                                </Panel>
                            </Col>

                            {/* Merge To Panel */}
                            <Col xs={5}>
                                <ProfileSidebar
                                    expand={true}
                                    setExpand={setExpand}
                                    windowHeight={windowHeight}
                                    setLocalPatient={setToPatient}
                                    refetchData={refetchData}
                                    setRefetchData={setRefetchData}
                                    title='Merge To'
                                    showButton= {false}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Grid>

        </>
    );
};

export default PatientMergeFiles;
export const calculateAgeFormat = dateOfBirth => {
    const today = new Date();
    const dob = new Date(dateOfBirth);

    if (isNaN(dob.getTime())) {
        return '';
    }

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();

    let days = today.getDate() - dob.getDate();
    if (months < 0 || (months === 0 && days < 0)) {
        years--;
        months += 12;
    }
    if (days < 0) {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 0);
        days += lastMonth.getDate();
        months--;
    }
    const totalDays = (years * 365) + (months * 30) + days;

    let ageString = '';

    if (years > 0) {
        ageString += `${years}y `;
    }

    if (months > 0) {
        ageString += `${months}m `;
    }

    if (days > 0) {
        ageString += `${days}d`;
    }

    return ageString.trim();
}