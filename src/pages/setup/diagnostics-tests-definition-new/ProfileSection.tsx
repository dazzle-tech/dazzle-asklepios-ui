import AddOutlineIcon from '@rsuite/icons/AddOutline';
import SearchIcon from '@rsuite/icons/Search';
import React from 'react';
import { Badge, Dropdown, Input, InputGroup } from 'rsuite';
import { FaChartLine, FaUndo } from 'react-icons/fa';
import { MdDelete, MdEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { DiagnosticTestProfile } from '@/types/model-types-new';
import { conjureValueBasedOnKeyFromList } from '@/utils';

interface ProfileSectionProps {
  profile: DiagnosticTestProfile;
  setProfile: React.Dispatch<React.SetStateAction<DiagnosticTestProfile>>;
  profiles: DiagnosticTestProfile[];
  loading: boolean;
  resultTypes: any[];
  units: any[];
  lovs: any[];
  searchKeyword: string;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  onSave: () => void;
  onClear: () => void;
  onToggleActive: (profile: DiagnosticTestProfile) => void;
  onSelect: (profile: DiagnosticTestProfile) => void;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
}

const ProfileSection = ({
  profile,
  setProfile,
  profiles,
  loading,
  resultTypes,
  units,
  lovs,
  searchKeyword,
  setSearchKeyword,
  onSave,
  onClear,
  onToggleActive,
  onSelect,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange
}: ProfileSectionProps) => {
  const isEditMode = Boolean(profile?.id);
  const isLovType = profile.resultType?.toUpperCase() === 'LOV';
  const isNumberType = profile.resultType === 'NUMBER';
  const isTextType = profile.resultType?.toUpperCase() === 'TEXT';
  const filteredLovs = lovs.filter(item =>
    `${item.lovCode} ${item.lovName}`.toLowerCase().includes(searchKeyword.toLowerCase())
  );
  const selectedLov = lovs.find(item => String(item.key) === String(profile.listOfValueId));

  const columns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 3,
      render: (rowData: DiagnosticTestProfile) =>
        rowData.isDefault ? (
          <Badge color="blue" content="Default">
            <span className="insurance-badge-text" style={{ fontSize: '14px' }}>
              {rowData.name}
            </span>
          </Badge>
        ) : (
          <span>{rowData.name}</span>
        )
    },
    {
      key: 'resultUnit',
      title: <Translate>Result Unit</Translate>,
      render: (rowData: DiagnosticTestProfile) => (
        <span>{conjureValueBasedOnKeyFromList(units, rowData.resultUnit, 'lovDisplayVale')}</span>
      )
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: DiagnosticTestProfile) => (
        <div className="container-of-icons" onClick={event => event.stopPropagation()}>
          {!rowData.isDefault &&
            (rowData.isActive ? (
              <MdDelete
                title="Deactivate"
                size={24}
                fill="var(--primary-pink)"
                className="icons-style"
                onClick={() => onToggleActive(rowData)}
              />
            ) : (
              <FaUndo
                title="Activate"
                size={24}
                fill="var(--primary-gray)"
                className="icons-style"
                onClick={() => onToggleActive(rowData)}
              />
            ))}
          {!String(rowData.resultType ?? '').toUpperCase().includes('TEXT') && (
            <FaChartLine
              className="icons-style"
              title="Test Normal Ranges"
              size={21}
              fill="var(--primary-gray)"
              onClick={() => onSelect(rowData)}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <section className="diagnostic-section profile-section">
      <div className="profile-form-header">
        <div className="profile-fields-main-container">
          <MyInput required column fieldName="name" record={profile} setRecord={setProfile} width="9vw" />
          <MyInput
            required
            column
            fieldName="resultType"
            fieldType="select"
            selectData={resultTypes}
            selectDataLabel="label"
            selectDataValue="value"
            record={profile}
            setRecord={setProfile}
            width="9vw"
          />
        </div>
        <div className="profile-lov-unit-main-container">
          {!isTextType && isNumberType && (
            <MyInput
              column
              menuMaxHeight={200}
              width="100%"
              fieldName="resultUnit"
              fieldType="select"
              selectData={units}
              selectDataLabel="lovDisplayVale"
              disableByField="isValid"
              selectDataValue="key"
              record={profile}
              setRecord={setProfile}
              required
            />
          )}
          {isLovType && (
            <div className="lov-block">
              <div className="container-of-menu-diagnostic">
                <InputGroup className="search-input-diagnostic" inside>
                  <Input placeholder="Search LOV" value={searchKeyword} onChange={setSearchKeyword} />
                  <InputGroup.Button>
                    <SearchIcon />
                  </InputGroup.Button>
                </InputGroup>
                {searchKeyword && (
                  <Dropdown.Menu className="menu-diagnostic">
                    {filteredLovs.map(lov => (
                      <Dropdown.Item
                        key={lov.key}
                        onClick={() => {
                          setProfile(previous => ({ ...previous, listOfValueId: lov.key }));
                          setSearchKeyword('');
                        }}
                      >
                        <span>{lov.lovCode}</span>
                        <span>{lov.lovName}</span>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                )}
              </div>
              <Input
                className="search-result-diagnostic"
                disabled
                value={selectedLov ? `${selectedLov.lovCode}, ${selectedLov.lovName}` : ''}
                placeholder="Selected LOV"
              />
            </div>
          )}
        </div>
        <div className="profile-actions">
          {isEditMode && (
            <MyButton color="var(--primary-gray)" onClick={onClear}>
              Clear
            </MyButton>
          )}
          <MyButton
            prefixIcon={() => (isEditMode ? <MdEdit size={18} /> : <AddOutlineIcon />)}
            color={isEditMode ? 'var(--primary-green)' : 'var(--deep-blue)'}
            onClick={onSave}
          >
            {isEditMode ? 'Update' : 'Add'}
          </MyButton>
        </div>
      </div>
      <div className="table-wrapper">
        <MyTable
          height={280}
          data={profiles}
          loading={loading}
          columns={columns}
          rowClassName={rowData => (rowData.id === profile.id ? 'selected-row' : '')}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={(_, nextPage) => onPageChange(nextPage)}
          onRowsPerPageChange={event => onRowsPerPageChange(Number(event.target.value))}
          onRowClick={onSelect}
        />
      </div>
    </section>
  );
};

export default ProfileSection;