import MyInput from '@/components/MyInput';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import Translate from '@/components/Translate';
import UserSearch from '@/images/svgs/UserSearch';
import { useGetPatientsQuery } from '@/services/patientService';
import type { ApPatient } from '@/types/model-types';
import { initialListRequest, type ListRequest } from '@/types/types';
import { fromCamelCaseToDBName } from '@/utils';
import { Box, Skeleton } from '@mui/material';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { FaArrowRight, FaEllipsis } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import {
  Button,
  Form,
  Input,
  InputGroup,
  Nav,
  Panel,
  Sidebar,
  Sidenav,
  DatePicker
} from 'rsuite';

interface ProfileSidebarProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  windowHeight: number;
  setLocalPatient: (patient: ApPatient) => void;
  refetchData: boolean;
  setRefetchData: (value: boolean) => void;
  title?: string;
  direction? : string;
  showButton?: boolean;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  expand,
  setExpand,
  windowHeight,
  setLocalPatient,
  refetchData,
  setRefetchData,
  title :title = <Translate>Search Patient</Translate>,
  direction : direction = 'left' ,
  showButton : showButton = true,
}) => {
  const [open, setOpen] = useState(false);
  const mode = useSelector((state: any) => state.ui.mode);
  const [labelTitle, setLabelTitle] = useState('Full Name');
  const [selectedCriterion, setSelectedCriterion] = useState('fullName');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary');
  const [dateValue, setDateValue] = useState<Date | null>(null);

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: !searchKeyword || searchKeyword.length < 3
  });

  const {
    data: patientListResponse,
    isLoading: isGettingPatients,
    isFetching: isFetchingPatients,
    refetch
  } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });

  const searchCriteriaOptions = [
    { label: <Translate>MRN</Translate>, value: 'patientMrn' },
    { label: <Translate>Primary Document</Translate>, value: 'documentNo' },
    { label: <Translate>Full Name</Translate>, value: 'fullName' },
    { label: <Translate>Archiving Number</Translate>, value: 'archivingNumber' },
    { label: <Translate>Primary Phone Number</Translate>, value: 'phoneNumber' },
    { label: <Translate>Date Of Birth</Translate>, value: 'dob' }
  ].map(option => ({
    ...option,
    label: <span style={{ textTransform: 'capitalize' }}>{option.label}</span>
  }));

  const handleSelect = value => {
    setSelectedCriterion(value);
    setOpen(false);
  };

  const search = target => {
    setPatientSearchTarget(target);
    setSearchResultVisible(true);

    let searchValue = searchKeyword;
    
    if (selectedCriterion === 'dob' && dateValue) {
      try {
        // Format date safely
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        searchValue = `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Invalid date:', error);
        return;
      }
    }

    if ((searchKeyword && searchKeyword.length >= 3 && selectedCriterion !== 'dob') || 
        (selectedCriterion === 'dob' && dateValue && searchValue)) {
      setListRequest({
        ...listRequest,
        ignore: false,
        filters: [
          {
            fieldName: fromCamelCaseToDBName(selectedCriterion),
            operator: selectedCriterion === 'dob' ? 'equals' : 'containsIgnoreCase',
            value: searchValue
          }
        ]
      });
    }
  };

  const conjurePatientSearchBar = target => {
    return (
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
            setRecord={record => {
              const newValue = record?.searchCriteria;

              if (!newValue) {
                setLabelTitle('');
                handleSelect(null);
                return;
              }

              const selectedOption = searchCriteriaOptions.find(
                option => option.value === newValue
              );

              if (selectedOption) {
                // Extract text value, label is JSX element <Translate>
                setLabelTitle(String(selectedOption.value));
                handleSelect(selectedOption.value);
              }
            }}
            placeholder="Select Search Criteria"
            searchable={false}
            width="auto"
          />
        </Form>

        {selectedCriterion === 'dob' ? (
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <DatePicker
              format="yyyy-MM-dd"
              placeholder="Select Date of Birth"
              value={dateValue}
              onChange={(value) => {
                setDateValue(value);
              }}
              oneTap
              style={{ flex: 1 }}
            />
            <Button 
              appearance="primary" 
              onClick={() => search(target)}
              disabled={!dateValue}
            >
              <SearchIcon />
            </Button>
          </div>
        ) : (
          <InputGroup inside>
            <Input
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  search(target);
                }
              }}
              placeholder={'Search Patients'}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e)}
              width="auto"
            />
            <InputGroup.Button onClick={() => search(target)}>
              <SearchIcon />
            </InputGroup.Button>
          </InputGroup>
        )}
      </div>
    );
  };

  // Reset search keyword when criterion changes
  React.useEffect(() => {
    setSearchKeyword('');
    setDateValue(null);
    // Reset list to show all patients when clearing filters
    setListRequest({
      ...initialListRequest,
      ignore: true
    });
  }, [selectedCriterion]);

  useEffect(() => {
    if (refetchData) {
      refetch();
    }
    setRefetchData(false)
  }, [refetchData]);

  return (
    <div
      className={clsx(`profile-sidebar-container ${mode === 'light' ? 'light' : 'dark'}`, {
        expanded: expand,
        'not-expanded': !expand
      })}
    >
      <Sidebar width={expand ? 300 : 56} collapsible className="profile-sidebar">
        <Sidenav
          expanded={expand}
          appearance="subtle"
          defaultOpenKeys={['2', '3']}
          className="profile-sidenav"
        >
          <Sidenav.Body>
            <Nav>
              {expand ? (
                <Panel header={title} className="sidebar-panel">
                 {showButton && <Button onClick={() => setExpand(false)} className="expand-sidebar"> 
                    <FaArrowRight />
                  </Button>}
                  {conjurePatientSearchBar(patientSearchTarget)}
                  <Box className="patient-list">
                    {isFetchingPatients ? (
                      // Show 4 skeleton cards as placeholder
                      Array.from({ length: 4 }).map((_, index) => (
                        <Box width={250} key={index} className="patient-list-loader" >
                          <div className="patient-list-loader-circle">
                            <Skeleton variant="circular" width={40} height={40} className='loader-circle' />
                            <Skeleton variant="text" width="80%" height={25} className='loader-text' />
                          </div>
                          <Skeleton variant="rectangular" height={90} className='loader-rectangular' />
                          <Skeleton width="100%" />
                        </Box>
                      ))
                    ) : (
                      patientListResponse?.object?.map(patient => (
                        <PatientCardWithPicture
                          key={patient.key}
                          patient={patient}
                          onClick={() => setLocalPatient(patient)}
                          actions={
                            <Button className="actions-button">
                              <FaEllipsis />
                            </Button>
                          }
                          arrowDirection= {direction as "left" | "right"}
                        />
                      ))
                    )}
                  </Box>
                </Panel>
              ) : (
                <Button
                  onClick={() => {
                    setExpand(true);
                  }}
                  className="user-search-btn"
                >
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