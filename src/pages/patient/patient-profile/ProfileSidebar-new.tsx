import MyInput from '@/components/MyInput';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import Translate from '@/components/Translate';
import UserSearch from '@/images/svgs/UserSearch';

import {
  useLazyGetPatientsByArchivingNumberQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByFullNameQuery,
  useLazyGetPatientsByMedicalRecordNumberQuery,
  useLazyGetPatientsByPrimaryPhoneQuery,
  useLazyGetPatientsByAnyDocumentNumberQuery,
 
} from '@/services/patient/patientService';

import { Box, Skeleton } from '@mui/material';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { FaArrowRight, FaEllipsis } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { Button, Form, Input, InputGroup, Nav, Panel, Sidebar, Sidenav, DatePicker } from 'rsuite';

import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { Patient } from '@/types/model-types-new';

interface ProfileSidebarProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  windowHeight: number;
  setLocalPatient: (patient: Patient) => void;
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
  const [links, setLinks] = useState<any>({});
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const [fetchByMrn] = useLazyGetPatientsByMedicalRecordNumberQuery();
  const [fetchByArchiving] = useLazyGetPatientsByArchivingNumberQuery();
  const [fetchByPrimaryPhone] = useLazyGetPatientsByPrimaryPhoneQuery();
  const [fetchByDob] = useLazyGetPatientsByDateOfBirthQuery();
  const [fetchByFullName] = useLazyGetPatientsByFullNameQuery();
  const [fetchByDocumentNo] = useLazyGetPatientsByAnyDocumentNumberQuery();

  const selectTrigger = () => {
    switch (selectedCriterion) {
      case 'patientMrn':
        return fetchByMrn;
      case 'archivingNumber':
        return fetchByArchiving;
      case 'phoneNumber':
        return fetchByPrimaryPhone;
      case 'documentNo':
        return fetchByDocumentNo;
      case 'dob':
        return fetchByDob;
      default:
        return fetchByFullName;
    }
  };

  const buildParams = (page = 0) => {
    const params: any = {
      page,
      size: PAGE_SIZE,
      sort: 'id,asc'
    };

    switch (selectedCriterion) {
      case 'patientMrn':
        params.medicalRecordNumber = searchKeyword;
        break;

      case 'documentNo':
        params.number = searchKeyword;
        break;

      case 'archivingNumber':
        params.archivingNumber = searchKeyword;
        break;

      case 'phoneNumber':
        params.phone = searchKeyword;
        break;

      case 'dob':
        params.date = searchKeyword;
        break;

      default:
        params.keyword = searchKeyword;
    }

    return params;
  };

  const search = useCallback(
    async (page = 0) => {
      if (selectedCriterion !== 'dob' && searchKeyword.length < 3) return;
      if (selectedCriterion === 'dob' && searchKeyword.length < 4) return;

      setIsLoadingPatients(true);

      const trigger = selectTrigger();
      const params = buildParams(page);

      const resp = await trigger(params).unwrap();
      console.log('Search response:', resp);
      if (page === 0) setPatients(resp.data);
      else setPatients(prev => [...prev, ...resp.data]);

      setLinks(resp.links || {});
      setIsLoadingPatients(false);
    },
    [searchKeyword, selectedCriterion]
  );

  const loadMore = async () => {
    if (!links?.next) return;

    const { page } = extractPaginationFromLink(links.next);
    search(page);
  };

  useEffect(() => {
    if (refetchData) {
      if (searchKeyword.length >= 3) search(0);
      setRefetchData?.(false);
    }
  }, [refetchData]);

  useEffect(() => {
    setPatients([]);
    setLinks({});
    setSearchKeyword('');
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

                  <div className="patient-search-container">
                    <Form fluid>
                      <MyInput
                        fieldType="select"
                        fieldName="searchCriteria"
                        selectData={[
                          { label: <Translate>MRN</Translate>, value: 'patientMrn' },
                          { label: <Translate>Document Number</Translate>, value: 'documentNo' },
                          { label: <Translate>Full Name</Translate>, value: 'fullName' },
                          {
                            label: <Translate>Archiving Number</Translate>,
                            value: 'archivingNumber'
                          },
                          {
                            label: <Translate>Primary Phone Number</Translate>,
                            value: 'phoneNumber'
                          },
                          { label: <Translate>Date of Birth</Translate>, value: 'dob' }
                        ]}
                        selectDataLabel="label"
                        selectDataValue="value"
                        showLabel={false}
                        record={{ searchCriteria: selectedCriterion }}
                        setRecord={r => setSelectedCriterion(r.searchCriteria)}
                        width={300}
                      />
                    </Form>

                    {/* التعديل فقط هنا */}
                    {selectedCriterion === 'dob' ? (
                      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                        <DatePicker
                          format="dd-MM-yyyy"
                          placeholder="Select Date of Birth"
                          style={{ flex: 1 }}
                          oneTap
                          value={searchKeyword ? new Date(searchKeyword) : null}
                          onChange={val => {
                            if (!val) {
                              setSearchKeyword('');
                              return;
                            }
                            const year = val.getFullYear();
                            const month = String(val.getMonth() + 1).padStart(2, '0');
                            const day = String(val.getDate()).padStart(2, '0');
                            setSearchKeyword(`${year}-${month}-${day}`);
                          }}
                        />
                        <Button
                          appearance="primary"
                          onClick={() => search(0)}
                          disabled={!searchKeyword}
                        >
                          <SearchIcon />
                        </Button>
                      </div>
                    ) : (
                      <InputGroup inside>
                        <Input
                          placeholder="Search Patients"
                          value={searchKeyword}
                          onChange={val => setSearchKeyword(val)}
                          onKeyDown={e => e.key === 'Enter' && search(0)}
                        />
                        <InputGroup.Button onClick={() => search(0)}>
                          <SearchIcon />
                        </InputGroup.Button>
                      </InputGroup>
                    )}
                  </div>

                  <Box className="patient-list">
                    {isLoadingPatients ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <Box width={250} key={index} className="patient-list-loader">
                          <div className="patient-list-loader-circle">
                            <Skeleton
                              variant="circular"
                              width={40}
                              height={40}
                              className="loader-circle"
                            />
                            <Skeleton
                              variant="text"
                              width="80%"
                              height={25}
                              className="loader-text"
                            />
                          </div>
                          <Skeleton
                            variant="rectangular"
                            height={90}
                            className="loader-rectangular"
                          />
                          <Skeleton width="100%" />
                        </Box>
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

                        {links?.next && (
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
