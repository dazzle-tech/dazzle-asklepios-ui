import React, { useEffect } from 'react';
import { Form, Input, InputGroup, Button, DatePicker, Sidebar, Sidenav, Nav, Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import SearchIcon from '@rsuite/icons/Search';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { Box, Skeleton } from '@mui/material';
import PatientCardWithPicture from '@/components/PatientCard/PatientCardWithPicture';
import type { ApPatient } from '@/types/model-types';
import { FaTimes } from 'react-icons/fa';

type CriterionType = 'patientMrn' | 'documentNo' | 'fullName' | 'archivingNumber' | 'phoneNumber' | 'dob';

interface PatientSearchBarProps {
  selectedCriterion: CriterionType | null | undefined;
  searchKeyword: string;
  dateValue: Date | null;
  onCriterionChange: (criterion: CriterionType | null) => void;
  onSearchKeywordChange: (keyword: string) => void;
  onDateValueChange: (date: Date | null) => void;
  onSearch: () => void;
  expand?: boolean;
  title?: React.ReactNode;
  patientListResponse?: any;
  isFetchingPatients?: boolean;
  onSelectPatient?: (patient: ApPatient) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const PatientSearchBar: React.FC<PatientSearchBarProps> = ({
  selectedCriterion,
  searchKeyword,
  dateValue,
  onCriterionChange,
  onSearchKeywordChange,
  onDateValueChange,
  onSearch,
  expand = true,
  title = <Translate>Search Patient</Translate>,
  patientListResponse,
  isFetchingPatients = false,
  onSelectPatient,
  onClose,
  showCloseButton = true
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const effectiveCriterion: CriterionType = (selectedCriterion ?? 'fullName') as CriterionType;
  
  const searchCriteriaOptions = [
    { label: <Translate>MRN</Translate>, value: 'patientMrn' },
    { label: <Translate>Document Number</Translate>, value: 'documentNo' },
    { label: <Translate>Full Name</Translate>, value: 'fullName' },
    { label: <Translate>Archiving Number</Translate>, value: 'archivingNumber' },
    { label: <Translate>Primary Phone Number</Translate>, value: 'phoneNumber' },
    { label: <Translate>Date of Birth</Translate>, value: 'dob' }
  ].map(option => ({
    ...option,
    label: <span style={{ textTransform: 'capitalize' }}>{option.label}</span>
  }));

  // Ensure the "prefilled" UI state matches the actual criterion state used by the search logic.
  // Without this, the dropdown shows "Full Name" while selectedCriterion stays null/undefined,
  // and a search may be executed with no criterion.
  useEffect(() => {
    if (selectedCriterion == null) {
      onCriterionChange('fullName');
    }
  }, [selectedCriterion, onCriterionChange]);

  const handleSelect = (value: CriterionType | null) => {
    onCriterionChange(value);
  };

  const conjurePatientSearchBar = () => {
    return (
      <div className="patient-search-container" style={{ position: 'relative', zIndex: 1 }}>
        <Form fluid>
          <MyInput
            fieldType="select"
            fieldName="searchCriteria"
            selectData={searchCriteriaOptions}
            selectDataLabel="label"
            selectDataValue="value"
            showLabel={false}
            record={{ searchCriteria: effectiveCriterion }}
            setRecord={record => {
              const newValue = record?.searchCriteria;

              if (!newValue) {
                handleSelect(null);
                return;
              }

              const selectedOption = searchCriteriaOptions.find(
                option => option.value === newValue
              );

              if (selectedOption) {
                handleSelect(selectedOption.value as CriterionType);
              }
            }}
            placeholder="Select Search Criteria"
            searchable={false}
            width="auto"
            container={() => document.body}
            preventOverflow={false}
          />
        </Form>

        {effectiveCriterion === 'dob' ? (
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <DatePicker
              format="yyyy-MM-dd"
              placeholder="Select Date of Birth"
              value={dateValue}
              onChange={(value) => {
                onDateValueChange(value);
              }}
              oneTap
              style={{ flex: 1 }}
            />
            <Button 
              appearance="primary" 
              onClick={onSearch}
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
                  onSearch();
                }
              }}
              placeholder={'Search Patients'}
              value={searchKeyword}
              onChange={e => onSearchKeywordChange(e)}
              width="auto"
            />
            <InputGroup.Button onClick={onSearch}>
              <SearchIcon />
            </InputGroup.Button>
          </InputGroup>
        )}
      </div>
    );
  };

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
                <Panel header={showCloseButton ? title : undefined} className="sidebar-panel">
                  {conjurePatientSearchBar()}
                  <Box className="patient-list">
                    {isFetchingPatients ? (
                      // Show 4 skeleton cards as placeholder
                      Array.from({ length: 4 }).map((_, index) => (
                        <Box width={250} key={index} className="patient-list-loader">
                          <div className="patient-list-loader-circle">
                            <Skeleton variant="circular" width={40} height={40} className="loader-circle" />
                            <Skeleton variant="text" width="80%" height={25} className="loader-text" />
                          </div>
                          <Skeleton variant="rectangular" height={90} className="loader-rectangular" />
                          <Skeleton width="100%" />
                        </Box>
                      ))
                    ) : patientListResponse?.object?.length > 0 ? (
                      patientListResponse.object.map((patient: ApPatient) => (
                        <PatientCardWithPicture
                          key={patient.key}
                          patient={patient}
                          onClick={() => {
                            if (onSelectPatient) {
                              onSelectPatient(patient);
                            }
                          }}
                          arrowDirection="right"
                        />
                      ))
                    ) : (
                      <Box
                        sx={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#666',
                          border: '1px dashed #ddd',
                          borderRadius: '8px'
                        }}
                      >
                        <Translate>No patients found</Translate>
                      </Box>
                    )}
                  </Box>
                </Panel>
              ) : null}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
      </Sidebar>
    </div>
  );
};

export default PatientSearchBar;