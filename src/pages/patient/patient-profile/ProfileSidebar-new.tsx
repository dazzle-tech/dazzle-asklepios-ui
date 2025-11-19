import MyInput from '@/components/MyInput';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import Translate from '@/components/Translate';
import UserSearch from '@/images/svgs/UserSearch';

import {
  useLazyGetPatientsByArchivingNumberQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByFullNameQuery,
  useLazyGetPatientsByMrnQuery,
  useLazyGetPatientsByPrimaryPhoneQuery,
  useLazyGetPatientsQuery
} from '@/services/patient/patientService';

import type { ApPatient } from '@/types/model-types';
import { Box, Skeleton } from '@mui/material';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { FaArrowRight, FaEllipsis } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { Button, Form, Input, InputGroup, Nav, Panel, Sidebar, Sidenav } from 'rsuite';

interface ProfileSidebarProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  windowHeight: number;
  setLocalPatient: (patient: ApPatient) => void;
  refetchData?: boolean;
  setRefetchData?: (value: boolean) => void;
  title?: React.ReactNode;
  direction?: string;
  showButton?: boolean;
}

const PAGE_SIZE = 10;

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  expand,
  setExpand,
  setLocalPatient,
  title = <Translate>Search Patient</Translate>,
  direction = 'left',
  showButton = true
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const [selectedCriterion, setSelectedCriterion] = useState('fullName');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [page, setPage] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLastPage, setIsLastPage] = useState(false);

  // NEW LOADING STATE
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Lazy Endpoints
  const [triggerFn, setTriggerFn] = useState<any>(() => null);

  const [fetchPatients] = useLazyGetPatientsQuery();
  const [fetchByMrn] = useLazyGetPatientsByMrnQuery();
  const [fetchByArchiving] = useLazyGetPatientsByArchivingNumberQuery();
  const [fetchByPrimaryPhone] = useLazyGetPatientsByPrimaryPhoneQuery();
  const [fetchByDob] = useLazyGetPatientsByDateOfBirthQuery();
  const [fetchByFullName] = useLazyGetPatientsByFullNameQuery();

  const searchCriteriaOptions = [
    { label: <Translate>MRN</Translate>, value: 'patientMrn' },
    { label: <Translate>Document Number</Translate>, value: 'documentNo' },
    { label: <Translate>Full Name</Translate>, value: 'fullName' },
    { label: <Translate>Archiving Number</Translate>, value: 'archivingNumber' },
    { label: <Translate>Primary Phone Number</Translate>, value: 'phoneNumber' },
    { label: <Translate>Date of Birth</Translate>, value: 'dob' }
  ];

  const search = () => {
    if (searchKeyword.length < 3) return;

    setPage(0);
    setPatients([]);
    setIsLastPage(false);

    let newTriggerFn: any;

    switch (selectedCriterion) {
      case 'patientMrn':
        newTriggerFn = fetchByMrn;
        break;
      case 'archivingNumber':
        newTriggerFn = fetchByArchiving;
        break;
      case 'phoneNumber':
        newTriggerFn = fetchByPrimaryPhone;
        break;
      case 'dob':
        newTriggerFn = fetchByDob;
        break;
      case 'fullName':
        newTriggerFn = fetchByFullName;
        break;
      default:
        newTriggerFn = fetchPatients;
        break;
    }

    setTriggerFn(() => newTriggerFn);

    loadPage(0, newTriggerFn);
  };

  const loadPage = async (pageIndex: number, fn?: any) => {
    const effectiveTrigger = fn || triggerFn;
    if (!effectiveTrigger) return;

    setIsLoadingPatients(true); 

    const params: any = {
      page: pageIndex,
      size: PAGE_SIZE
    };

    if (selectedCriterion === 'patientMrn') params.mrn = searchKeyword;
    if (selectedCriterion === 'archivingNumber') params.archivingNumber = searchKeyword;
    if (selectedCriterion === 'phoneNumber') params.phone = searchKeyword;
    if (selectedCriterion === 'dob') params.date = searchKeyword;
    if (selectedCriterion === 'fullName') params.keyword = searchKeyword;

    const result = await effectiveTrigger(params);

    const response = result?.data;
    const newData = response?.data || [];
    const last = response?.last ?? true;

    if (pageIndex === 0) setPatients(newData);
    else setPatients(prev => [...prev, ...newData]);

    setIsLastPage(last);
    setIsLoadingPatients(false);
  };


  useEffect(() => {
    setSearchKeyword('');
    setPatients([]);
    setPage(0);
    setIsLastPage(false);
  }, [selectedCriterion]);

  return (
    <div
      className={clsx(`profile-sidebar-container ${mode === 'light' ? 'light' : 'dark'}`, {
        expanded: expand,
        'not-expanded': !expand
      })}
    >
      <Sidebar width={expand ? 300 : 56} collapsible className="profile-sidebar">
        <Sidenav expanded={expand} appearance="subtle" className="profile-sidenav">
          <Sidenav.Body>
            <Nav>
              {expand ? (
                <Panel header={title} className="sidebar-panel">
                  {showButton && (
                    <Button onClick={() => setExpand(false)} className="expand-sidebar">
                      <FaArrowRight />
                    </Button>
                  )}

                  {/* Search UI */}
                  <div className="patient-search-container">
                    <Form fluid>
                      <MyInput
                        fieldType="select"
                        fieldName="searchCriteria"
                        selectData={searchCriteriaOptions}
                        selectDataLabel="label"
                        selectDataValue="value"
                        showLabel={false}
                        record={{ searchCriteria: selectedCriterion }}
                        setRecord={record => setSelectedCriterion(record.searchCriteria)}
                        placeholder="Select Search Criteria"
                        searchable={false}
                        width="auto"
                      />
                    </Form>

                    <InputGroup inside>
                      <Input
                        onKeyDown={e => {
                          if (e.key === 'Enter') search();
                        }}
                        placeholder="Search Patients"
                        value={searchKeyword}
                        onChange={val => setSearchKeyword(val)}
                      />
                      <InputGroup.Button onClick={search}>
                        <SearchIcon />
                      </InputGroup.Button>
                    </InputGroup>
                  </div>

                  <Box className="patient-list">
                    {isLoadingPatients ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <Box width={250} key={index} className="patient-list-loader">
                          <div className="patient-list-loader-circle">
                            <Skeleton variant="circular" width={40} height={40} />
                            <Skeleton variant="text" width="80%" height={25} />
                          </div>
                          <Skeleton variant="rectangular" height={90} />
                          <Skeleton width="100%" />
                        </Box>
                      ))
                    ) : patients.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        <Translate>No patients found</Translate>
                      </div>
                    ) : (
                      patients.map(patient => (
                        <PatientCardWithPicture
                          key={patient.id}
                          patient={patient}
                          onClick={() => setLocalPatient(patient)}
                          actions={
                            <Button className="actions-button">
                              <FaEllipsis />
                            </Button>
                          }
                          arrowDirection={direction as 'left' | 'right'}
                        />
                      ))
                    )}

                    {!isLoadingPatients &&
                      !isLastPage &&
                      patients.length !== 0 &&
                      patients.length % PAGE_SIZE === 0 && (
                        <Button
                          appearance="ghost"
                          onClick={() => {
                            const nextPage = page + 1;
                            setPage(nextPage);
                            loadPage(nextPage);
                          }}
                          style={{ width: '100%', marginTop: 10 }}
                        >
                          Load More
                        </Button>
                      )}
                  </Box>
                </Panel>
              ) : (
                <Button onClick={() => setExpand(true)} className="user-search-btn">
                  <UserSearch />
                </Button>
              )}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
      </Sidebar>
    </div>
  );
};

export default ProfileSidebar;
