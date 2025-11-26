// PatientSearch.tsx (UI aligned with ProfileSidebar look)

import MyInput from '@/components/MyInput';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import Translate from '@/components/Translate';

import {
  useLazyGetPatientsQuery,
  useLazyGetPatientsByMrnQuery,
  useLazyGetPatientsByArchivingNumberQuery,
  useLazyGetPatientsByPrimaryPhoneQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByFullNameQuery,
} from '@/services/patient/patientService';

import { Box, Skeleton } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Input, InputGroup, Button } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { FaEllipsis } from 'react-icons/fa6';

import './style.less';

const PAGE_SIZE = 10;

const PatientSearch = ({
  selectedPatientRelation,
  setSelectedPatientRelation,
  searchResultVisible,
  setSearchResultVisible,
  patientSearchTarget,
  setPatientSearchTarget,
  allowedSecondGenders
}) => {
  const dispatch = useAppDispatch();

  const [selectedCriterion, setSelectedCriterion] = useState<
    'fullName' | 'patientMrn' | 'archivingNumber' | 'phoneNumber' | 'dob'
  >('fullName');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [page, setPage] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLastPage, setIsLastPage] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // lazy endpoints
  const [fetchPatients] = useLazyGetPatientsQuery();
  const [fetchByMrn] = useLazyGetPatientsByMrnQuery();
  const [fetchByArchiving] = useLazyGetPatientsByArchivingNumberQuery();
  const [fetchByPrimaryPhone] = useLazyGetPatientsByPrimaryPhoneQuery();
  const [fetchByDob] = useLazyGetPatientsByDateOfBirthQuery();
  const [fetchByFullName] = useLazyGetPatientsByFullNameQuery();

  const [triggerFn, setTriggerFn] = useState<any>(null);

  const searchCriteriaOptions = [
    { label: <Translate>MRN</Translate>, value: 'patientMrn' },
    { label: <Translate>Archiving Number</Translate>, value: 'archivingNumber' },
    { label: <Translate>Primary Phone Number</Translate>, value: 'phoneNumber' },
    { label: <Translate>Date of Birth</Translate>, value: 'dob' },
    { label: <Translate>Full Name</Translate>, value: 'fullName' },
  ];

  const filteredPatients = useMemo(() => {
    if (!allowedSecondGenders || allowedSecondGenders.length === 0) return patients;
    return patients.filter(p => allowedSecondGenders.includes(p.sexAtBirth));
  }, [patients, allowedSecondGenders]);

  const prepareTrigger = () => {
    switch (selectedCriterion) {
      case 'patientMrn':
        return fetchByMrn;
      case 'archivingNumber':
        return fetchByArchiving;
      case 'phoneNumber':
        return fetchByPrimaryPhone;
      case 'dob':
        return fetchByDob;
      case 'fullName':
      default:
        return fetchByFullName;
    }
  };

  const buildParams = (pageIndex: number) => {
    const params: any = { page: pageIndex, size: PAGE_SIZE };

    if (selectedCriterion === 'patientMrn') params.mrn = searchKeyword;
    if (selectedCriterion === 'archivingNumber') params.archivingNumber = searchKeyword;
    if (selectedCriterion === 'phoneNumber') params.phone = searchKeyword;
    if (selectedCriterion === 'dob') params.date = searchKeyword;
    if (selectedCriterion === 'fullName') params.keyword = searchKeyword;

    return params;
  };

  const loadPage = async (pageIndex: number, fn?: any) => {
    const effectiveTrigger = fn ?? triggerFn;
    if (!effectiveTrigger) return;

    setIsLoadingPatients(true);

    try {
      const result = await effectiveTrigger(buildParams(pageIndex));
      const response = result?.data;

      const newData = response?.data ?? response?.object ?? [];
      const last = response?.last ?? !(response?.links?.next);

      setPatients(prev => (pageIndex === 0 ? newData : [...prev, ...newData]));
      setIsLastPage(last);
    } catch (e) {
      dispatch(notify({ msg: 'Failed to load patients', sev: 'error' }));
      setPatients([]);
      setIsLastPage(true);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const search = (target: string) => {
    setPatientSearchTarget(target);
    setSearchResultVisible(true);

    if (!searchKeyword || searchKeyword.length < 3) {
      dispatch(notify({ msg: 'Enter at least 3 characters', sev: 'error' }));
      return;
    }

    const fn = prepareTrigger();
    setTriggerFn(() => fn);

    setPage(0);
    setPatients([]);
    setIsLastPage(false);

    loadPage(0, fn);
  };

  const handleSelectPatient = (patient: any) => {
    if (patientSearchTarget === 'relation') {
      setSelectedPatientRelation({
        ...(selectedPatientRelation ?? {}),
        relativePatientId: patient.id,
        relativePatient: patient,
      });
    }
    setSearchResultVisible(false);
  };

  const handleClose = () => {
    setSearchResultVisible(false);
    setSearchKeyword('');
    setPatients([]);
    setPage(0);
    setIsLastPage(true);
  };

  useEffect(() => {
    setSearchKeyword('');
    setPatients([]);
    setPage(0);
    setIsLastPage(true);
  }, [selectedCriterion]);

  return (
    <Drawer
      size="xs"
      placement="left"
      open={searchResultVisible}
      onClose={handleClose}
      className="patient-search-drawer"
    >
      <Drawer.Header>
        <Drawer.Title>
          <Translate>Patient List - Search Results</Translate>
        </Drawer.Title>
      </Drawer.Header>

      {/* Search UI like ProfileSidebar */}
      <Drawer.Actions>
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

          <InputGroup inside className="patient-search-input">
            <Input
              onKeyDown={e => {
                if (e.key === 'Enter') search(patientSearchTarget);
              }}
              placeholder="Search Patients"
              value={searchKeyword}
              onChange={val => setSearchKeyword(val)}
            />
            <InputGroup.Button onClick={() => search(patientSearchTarget)}>
              <SearchIcon />
            </InputGroup.Button>
          </InputGroup>
        </div>
      </Drawer.Actions>

      <Drawer.Body>
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
          ) : filteredPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Translate>No patients found</Translate>
            </div>
          ) : (
            filteredPatients.map(patient => (
              <PatientCardWithPicture
                key={patient.id}
                patient={patient}
                onClick={() => {
                  handleSelectPatient(patient);
                  handleClose();
                }}
                
                arrowDirection="right"
              />
            ))
          )}

          {!isLoadingPatients && !isLastPage && patients.length > 0 && (
            <Button
              appearance="ghost"
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                loadPage(nextPage);
              }}
              style={{ width: '100%', marginTop: 10 }}
            >
              <Translate>Load More</Translate>
            </Button>
          )}
        </Box>
      </Drawer.Body>
    </Drawer>
  );
};

export default PatientSearch;
