import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import { DOMHelper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { useGetEncountersQuery, } from '@/services/encounterService';
const { getHeight } = DOMHelper;
import ProfileSidebar from '../patient-profile/ProfileSidebar';
import { useNavigate } from 'react-router-dom';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useLocation } from 'react-router-dom';
import { ApPatient } from '@/types/model-types';
const PatientEMR = () => {
    const [expand, setExpand] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const location = useLocation();
    const propsData = location.state;
    const [encounter, setLocalEncounter] = useState({ ...newApEncounter });
    const [localPatient, setLocalPatient] = useState<ApPatient>(propsData?.fromPage === "clinicalVisit" ? propsData?.localPatient : { ...newApPatient });
     const [refetchData, setRefetchData] = useState(false);

    // Initialize Patient Encounters list request with default filters
    const [listEncounterRequest, setListEncounterRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: localPatient?.key || undefined
            },

        ]
    });
    // Fetch patient Encounters List
    const { data: encounterListResponse, isFetching } = useGetEncountersQuery(listEncounterRequest);
    const [windowHeight, setWindowHeight] = useState(getHeight(window));
    // Page Header Setup
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>Patients EMR</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Patients_EMR'));
    dispatch(setDivContent(divContentHTML));
    // Table Columns 
    const columns = [
        {
            key: 'visitId',
            flexGrow: 4,
            align: 'center' as const,
            title: (
                <Translate>VISIT ID</Translate>),
            render: (rowData: any) => (
                <span
                    style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => {
                        goToVisit(rowData);
                    }}
                >
                    {rowData.visitId}
                </span>
            )
        },
        {
            key: 'plannedStartDate',
            flexGrow: 4,
            sortable: true,
            title: (<Translate>DATE</Translate>),
            dataKey: 'plannedStartDate'
        },
        {
            key: 'diagnosis',
            flexGrow: 4,
            fullText: true,
            sortable: true,
            title: <Translate>DIAGNOSIS</Translate>,
            render: (rowData: any) => rowData.diagnosis
        },
        {
            key: 'status',
            flexGrow: 4,
            fullText: true,
            sortable: true,
            title: <Translate>STATUS</Translate>,
            render: (rowData: any) =>
                rowData.encounterStatusLvalue
                    ? rowData.encounterStatusLvalue.lovDisplayVale
                    : rowData.encounterStatusLkey
        }
    ];
    // Function to check if the current row is the selected one
    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
            return 'selected-row';
        } else return '';
    };
    // Hnadle Go to Visit Function
   const goToVisit = async (rowData) => {
  setLocalEncounter(rowData);
  dispatch(setEncounter(rowData));
  dispatch(setPatient(rowData['patientObject']));

  const privatePatientPath = '/user-access-patient-private';
  const encounterPath = '/encounter';
  const targetPath = rowData.patientObject?.privatePatient ? privatePatientPath : encounterPath;

  const stateData = {
    info: "toEncounter",
    fromPage: "PatientEMR",
    patient: rowData.patientObject,
    encounter: rowData
  };

  
  sessionStorage.setItem("encounterPageSource", "PatientEMR");

  navigate(targetPath, { state: stateData });
};

    // Effects
    useEffect(() => {
        if (!localPatient) {
            dispatch(setPatient({ ...newApPatient }));
        } else {
            const updatedFilters = [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined
                },
                {
                    fieldName: 'patient_key',
                    operator: 'match',
                    value: localPatient?.key || undefined
                }
            ];
            setListEncounterRequest((prevRequest) => ({

                ...prevRequest,
                filters: updatedFilters,

            }));
        }
    }, [localPatient]);
    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent("  "));
        };
    }, [location.pathname, dispatch]); return (
        <div style={{ display: 'flex', gap: '10px' }}>
            <div className={clsx('patient-profile-info', {
                expanded: expand
            })}>
                <MyTable
                    data={encounterListResponse?.object ?? []}
                    columns={columns}
                    height={580}
                    loading={isFetching}
                    onRowClick={rowData => {
                        setLocalPatient(rowData.patientObject);
                    }}
                    rowClassName={isSelected}
                />
            </div>
            <ProfileSidebar
                expand={expand}
                setExpand={setExpand}
                windowHeight={windowHeight}
                setLocalPatient={setLocalPatient}
                setRefetchData={setRefetchData}
                refetchData={refetchData}
            />
        </div>);
}
export default PatientEMR;