import React, { useState } from 'react';
import type { ApPatient } from '@/types/model-types';
import { initialListRequest, type ListRequest } from '@/types/types';
import { fromCamelCaseToDBName } from '@/utils';
import { useGetPatientsQuery } from '@/services/patientService';
import ArrowLineToggle from '@/components/Frame/ArrowLineToggle';
import {
  Sidebar,
  Sidenav,
  Nav,
  Panel,
  ButtonToolbar,
  Dropdown,
  InputGroup,
  Input,
  Row,
  Col,
  Avatar,
  Button,
  Form
} from 'rsuite';
import ArrowLeftLineIcon from '@rsuite/icons/ArrowLeftLine';
import MoreIcon from '@rsuite/icons/More';
import SearchIcon from '@rsuite/icons/Search';
import SearchPeopleIcon from '@rsuite/icons/SearchPeople';
import clsx from 'clsx';
import userSearch from '@/images/user-avatar.svg';
import UserSearch from '@/images/svgs/UserSearch';
import { ArrowRightLine } from '@rsuite/icons';
import MyInput from '@/components/MyInput';
import PatientCard from '@/components/PatientCard';
import { FaArrowRight, FaEllipsis } from 'react-icons/fa6';

interface ProfileSidebarProps {
  expand: boolean;
  setExpand: (value: boolean) => void;
  windowHeight: number;
  setLocalPatient: (patient: ApPatient) => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  expand,
  setExpand,
  windowHeight,
  setLocalPatient
}) => {
  const [open, setOpen] = useState(false);
  const [labelTitle, setLabelTitle] = useState(' ');
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary');

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: !searchKeyword || searchKeyword.length < 3
  });

  const {
    data: patientListResponse,
    isLoading: isGettingPatients,
    isFetching: isFetchingPatients
  } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });

  const searchCriteriaOptions = [
    { label: 'MRN', value: 'patientMrn' },
    { label: 'Document Number', value: 'documentNo' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Archiving Number', value: 'archivingNumber' },
    { label: 'Primary Phone Number', value: 'phoneNumber' },
    { label: 'Date of Birth', value: 'dob' }
  ];

  const handleSelect = value => {
    setSelectedCriterion(value);
    setOpen(false);
  };

  const search = target => {
    setPatientSearchTarget(target);
    setSearchResultVisible(true);

    if (searchKeyword && searchKeyword.length >= 3 && selectedCriterion) {
      setListRequest({
        ...listRequest,
        ignore: false,
        filters: [
          {
            fieldName: fromCamelCaseToDBName(selectedCriterion),
            operator: 'containsIgnoreCase',
            value: searchKeyword
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
                setLabelTitle(selectedOption.label);
                handleSelect(selectedOption.value);
              }
            }}
            placeholder="Select Search Criteria"
            searchable={false}
            width="auto"
          />
        </Form>

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
      </div>
    );
  };

  // const navBodyStyle: React.CSSProperties = expand
  //   ? { height: windowHeight, overflow: 'auto' }
  //   : { height: windowHeight };

  // Reset search keyword when criterion changes
  React.useEffect(() => {
    setSearchKeyword('');
  }, [selectedCriterion]);

  return (
    <div
      className={clsx('profile-sidebar-container', {
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
                <Panel header="Search Patient" className="sidebar-panel">
                  <Button onClick={() => setExpand(false)} className="expand-sidebar">
                    <FaArrowRight />
                  </Button>
                  {conjurePatientSearchBar(patientSearchTarget)}
                  <div className="patient-list">
                    {patientListResponse?.object?.map(patient => (
                      <PatientCard
                        key={patient.key}
                        patient={patient}
                        onClick={() => setLocalPatient(patient)}
                        actions={
                          <Button className="actions-button">
                            <FaEllipsis/>
                          </Button>
                        }
                      />
                    ))}
                  </div>
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
