import MyInput from '@/components/MyInput';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import Translate from '@/components/Translate';
import UserSearch from '@/images/svgs/UserSearch';

import {
  useLazyGetPatientsByAnyDocumentNumberQuery,
  useLazyGetPatientsByArchivingNumberQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByFullNameQuery,
  useLazyGetPatientsByMedicalRecordNumberQuery,
  useLazyGetPatientsByPrimaryPhoneQuery
} from '@/services/patient/patientService';

import { Box, Skeleton } from '@mui/material';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { FaArrowRight, FaEllipsis } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { Button, Form, Input, InputGroup, Panel, Sidebar, Sidenav } from 'rsuite';

import { Patient } from '@/types/model-types-new';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import './styles.less';
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
  searchRef?: React.MutableRefObject<(() => void) | null>;
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
  setRefetchData,
  searchRef
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
        if (typeof searchKeyword === 'string') {
          params.date = searchKeyword;
        }
        break;

      default:
        params.keyword = searchKeyword;
    }

    return params;
  };

  const search = useCallback(
    async (page = 0) => {
      if (selectedCriterion !== 'dob' && (!searchKeyword || String(searchKeyword).length < 3))
        return;
      if (selectedCriterion === 'dob' && !searchKeyword) return;
      setIsLoadingPatients(true);

      if (selectedCriterion === 'dob' && typeof searchKeyword === 'string') {
        try {
          const resp = await fetchByDob({
            date: searchKeyword,
            page,
            size: PAGE_SIZE,
            sort: 'id,asc'
          }).unwrap();

          if (page === 0) setPatients(resp.data);
          else setPatients(prev => [...prev, ...resp.data]);

          setLinks(resp.links || {});
        } catch (e) {
          console.error('Search error:', e);
        } finally {
          setIsLoadingPatients(false);
        }

        return;
      }

      const trigger = selectTrigger();
      const params = buildParams(page);

      try {
        const resp = await trigger(params).unwrap();

        if (page === 0) setPatients(resp.data);
        else setPatients(prev => [...prev, ...resp.data]);

        setLinks(resp.links || {});
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsLoadingPatients(false);
      }
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
      if (searchKeyword && String(searchKeyword).length >= 3) search(0);
      setRefetchData?.(false);
    }
  }, [refetchData]);

  useEffect(() => {
    if (searchRef) {
      searchRef.current = () => {
        if (searchKeyword && String(searchKeyword).length >= 3) search(0);
      };
    }
  }, [search, searchKeyword, searchRef]);

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
                          { label: 'Full Name', value: 'fullName' },
                          { label: 'MRN', value: 'patientMrn' },
                          { label: 'Document Number', value: 'documentNo' }
                        ]}
                        selectDataLabel="label"
                        selectDataValue="value"
                        showLabel={false}
                        record={{ searchCriteria: selectedCriterion }}
                        setRecord={r => {
                          const newCriterion = r?.searchCriteria;
                          if (!newCriterion) return;
                          if (newCriterion === selectedCriterion) return;

                          setSelectedCriterion(newCriterion);
                          setSearchKeyword('');
                          setPatients([]);
                          setLinks({});
                        }}
                        width="100%"
                        searchable={false}
                        cleanable={false}
                        virtualized={false}
                        preventOverflow={false}
                        container={() => document.body}
                        menuClassName="profile-sidebar-search-criteria-menu"
                      />
                    </Form>

                    {selectedCriterion === 'dob' ? (
                      <Form style={{ display: 'flex', gap: 8, width: '100%' }}>
                        <div className="width-problem" style={{ flex: 1 }}>
                          <MyInput
                            fieldType="date"
                            fieldName="dob"
                            showLabel={false}
                            width={300}
                            record={{ dob: searchKeyword }}
                            setRecord={r => {
                              setSearchKeyword(r.dob || null);
                            }}
                          />
                        </div>
                        <Button
                          appearance="primary"
                          onClick={() => search(0)}
                          disabled={!searchKeyword}
                        >
                          <SearchIcon />
                        </Button>
                      </Form>
                    ) : (
                      <InputGroup inside style={{ width: '100%' }}>
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
                        <Box width="100%" key={index} className="patient-list-loader">
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
                          <div
                            key={p.id}
                          
                          >
                            <PatientCardWithPicture
                              patient={p}
                              onClick={() => {
                              
                                setLocalPatient(p);
                              }}
                              actions={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {p.patientStatus === 'MERGED' && (
                                    <span className="patient-merged-badge">
                                      <Translate>Merged</Translate>
                                    </span>
                                  )}

                                  <Button className="actions-button">
                                    <FaEllipsis />
                                  </Button>
                                </div>
                              }
                              arrowDirection={direction as any}
                            />
                          </div>
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
          </Sidenav.Body>
        </Sidenav>
      </Sidebar>
    </div>
  );
};

export default ProfileSidebar;
