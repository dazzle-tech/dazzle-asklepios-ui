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


    const handleClear = () =>  {
     setToPatient(newApPatient);
     setFromPatient(newApPatient)
    }
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
        <Grid fluid>
                    {/* Main Content */}
                   
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
                                        <h6>From Patient</h6>
                                            <PatientInfoCard 
                                             patient={fromPatient}
                                            /> 
                                     

                                    <div className="merge-controls" style={{ textAlign: "center", margin: "20px 0" }}>
                                        <FontAwesomeIcon icon={faRepeat} style={{ fontSize: 100, transform: 'rotate(90deg)' }} />
                                    </div>
                                        <h6>Merge To</h6>
                                        <PatientInfoCard 
                                             patient={toPatient}
                                            /> 
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
                                        appearance="ghost"
                                    >
                                        Undo
                                    </MyButton>
                                    <MyButton
                                        size="small"
                                        prefixIcon={() => <icons.Close />}
                                        appearance="subtle"
                                        onClick={handleClear}
                                    >
                                        Clear
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