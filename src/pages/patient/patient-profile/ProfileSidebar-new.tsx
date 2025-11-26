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
import React, { useCallback, useEffect, useState } from 'react';
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
  showButton = true,
  refetchData,
  setRefetchData
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const [selectedCriterion, setSelectedCriterion] = useState('fullName');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [patients, setPatients] = useState<any[]>([]);
  const [fullResults, setFullResults] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const [fetchPatients] = useLazyGetPatientsQuery();
  const [fetchByMrn] = useLazyGetPatientsByMrnQuery();
  const [fetchByArchiving] = useLazyGetPatientsByArchivingNumberQuery();
  const [fetchByPrimaryPhone] = useLazyGetPatientsByPrimaryPhoneQuery();
  const [fetchByDob] = useLazyGetPatientsByDateOfBirthQuery();
  const [fetchByFullName] = useLazyGetPatientsByFullNameQuery();

  const selectTrigger = () => {
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
        return fetchByFullName;
      default:
        return fetchPatients;
    }
  };

  const search = useCallback(async () => {
    if (searchKeyword.length < 3) return;

    const trigger = selectTrigger();

    setIsLoadingPatients(true);

    const result = await trigger({
      page: 0,
      size: 9999, // نجلب كل النتائج مرة واحدة
      mrn: searchKeyword,
      archivingNumber: searchKeyword,
      phone: searchKeyword,
      date: searchKeyword,
      keyword: searchKeyword
    });

    const response = result?.data;
    const data = response?.data || [];

    // خزّن كل النتائج
    setFullResults(data);

    // أظهر أول PAGE_SIZE فقط
    setPatients(data.slice(0, PAGE_SIZE));

    setIsLoadingPatients(false);
  }, [searchKeyword, selectedCriterion]);

  // لو refetchData = true → أعمل Search من جديد
  useEffect(() => {
    if (refetchData) {
      search();
      setRefetchData?.(false);
    }
  }, [refetchData]);

  // عند تغيير المعايير
  useEffect(() => {
    setPatients([]);
    setFullResults([]);
    setSearchKeyword('');
  }, [selectedCriterion]);

  const loadMore = () => {
    const current = patients.length;
    const nextSlice = fullResults.slice(0, current + PAGE_SIZE);
    setPatients(nextSlice);
  };

  const hasMore = patients.length < fullResults.length;

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

                  <div className="patient-search-container">
                    <Form fluid>
                      <MyInput
                        fieldType="select"
                        fieldName="searchCriteria"
                        selectData={[
                          { label: <Translate>MRN</Translate>, value: 'patientMrn' },
                          { label: <Translate>Document Number</Translate>, value: 'documentNo' },
                          { label: <Translate>Full Name</Translate>, value: 'fullName' },
                          { label: <Translate>Archiving Number</Translate>, value: 'archivingNumber' },
                          { label: <Translate>Primary Phone Number</Translate>, value: 'phoneNumber' },
                          { label: <Translate>Date of Birth</Translate>, value: 'dob' }
                        ]}
                        selectDataLabel="label"
                        selectDataValue="value"
                        showLabel={false}
                        record={{ searchCriteria: selectedCriterion }}
                        setRecord={record => setSelectedCriterion(record.searchCriteria)}
                      />
                    </Form>

                    <InputGroup inside>
                      <Input
                        placeholder="Search Patients"
                        value={searchKeyword}
                        onChange={val => setSearchKeyword(val)}
                        onKeyDown={e => e.key === 'Enter' && search()}
                      />
                      <InputGroup.Button onClick={search}>
                        <SearchIcon />
                      </InputGroup.Button>
                    </InputGroup>
                  </div>

                  <Box className="patient-list">
                    {isLoadingPatients ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          variant="rectangular"
                          height={80}
                          style={{ marginBottom: 10 }}
                        />
                      ))
                    ) : patients.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        <Translate>No patients found</Translate>
                      </div>
                    ) : (
                      <>
                        {patients.map(p => (
                          <PatientCardWithPicture
                            key={p.id}
                            patient={p}
                            onClick={() => setLocalPatient(p)}
                            actions={
                              <Button className="actions-button">
                                <FaEllipsis />
                              </Button>
                            }
                            arrowDirection={direction as any}
                          />
                        ))}

                        {hasMore && (
                          <Button
                            appearance="ghost"
                            onClick={loadMore}
                            style={{ width: '100%', marginTop: 10 }}
                          >
                            Load More
                          </Button>
                        )}
                      </>
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
