import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { faEdit, faInfo, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Form, Radio, RadioGroup } from 'rsuite';
import './styles.less';

const LanguagesSetup = () => {
  // States for Languages Table
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [languageModalMode, setLanguageModalMode] = useState('add');
  const [languageForm, setLanguageForm] = useState({
    languageName: '',
    languageCode: '',
    direction: ''
  });

  // States for Language Values Table
  const [languageValues, setLanguageValues] = useState([]);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [valueForm, setValueForm] = useState({
    key: '',
    value: '',
    verify: 'N',
    translate: 'N'
  });

  // States for Search
  const [searchText, setSearchText] = useState('');
  const [exactValue, setExactValue] = useState(false);

  // Language Handlers
  const handleAddLanguage = () => {
    setLanguageModalMode('add');
    setLanguageForm({
      languageName: '',
      languageCode: '',
      direction: ''
    });
    setLanguageModalOpen(true);
  };

  const handleEditLanguage = () => {
    if (!selectedLanguage) return;
    setLanguageModalMode('edit');
    setLanguageForm({ ...selectedLanguage });
    setLanguageModalOpen(true);
  };

  const handleLanguageRowClick = rowData => {
    setSelectedLanguage(rowData);
  };

  // Language Values Handlers
  const handleAddValue = () => {
    setValueForm({
      key: '',
      value: '',
      verify: 'N',
      translate: 'N'
    });
    setValueModalOpen(true);
  };

  // Search Handler
  const handleSearch = () => {
    // Add your search logic here
    console.log('Search:', searchText, 'Exact:', exactValue);
  };

  // Language Table Buttons
  const languageTableButtons = (
    <div className="flex-10">
      <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={handleAddLanguage}>
        New
      </MyButton>
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}
        onClick={handleEditLanguage}
        disabled={!selectedLanguage}
      >
        Edit
      </MyButton>
      <MyButton prefixIcon={() => <FontAwesomeIcon icon={faInfo} />} appearance="ghost"></MyButton>
    </div>
  );

  // Language Values Table Buttons
  const valueTableButtons = (
    <div className="flex-10">
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
        onClick={handleAddValue}
        // disabled={!selectedLanguage}
      >
        New
      </MyButton>
    </div>
  );

  return (
    <div className="padding-header-20">
      {/* Header with Search */}
      <div className="flex-center-between">
        <h5>Languages</h5>
      </div>

      <div className="grid-20">
        {/* Languages Table */}
        <SectionContainer
          title={
            <>
              <Translate>Languages</Translate>
              {languageTableButtons}
            </>
          }
          content={
            <MyTable
              data={languages}
              columns={[
                {
                  key: 'languageName',
                  title: 'Language Name',
                  dataKey: 'languageName',
                  width: 150
                },
                {
                  key: 'languageCode',
                  title: 'Language Code',
                  dataKey: 'languageCode',
                  width: 150
                },
                {
                  key: 'direction',
                  title: 'Direction',
                  dataKey: 'direction',
                  width: 100
                }
              ]}
              height={400}
              loading={false}
              onRowClick={handleLanguageRowClick}
              rowClassName={rowData =>
                selectedLanguage?.languageCode === rowData.languageCode ? 'selected-row' : ''
              }
            />
          }
        ></SectionContainer>

        {/* Language Values Table */}
        <SectionContainer
          title={
            <>
              <Translate>Language Values</Translate>
              {valueTableButtons}
            </>
          }
          content={
            <MyTable
              data={languageValues}
              columns={[
                {
                  key: 'key',
                  title: 'Key',
                  dataKey: 'key',
                  width: 200
                },
                {
                  key: 'value',
                  title: 'Value',
                  dataKey: 'value',
                  width: 200
                },
                {
                  key: 'verify',
                  title: 'Verify',
                  dataKey: 'verify',
                  width: 80
                },
                {
                  key: 'translate',
                  title: 'Translate',
                  dataKey: 'translate',
                  width: 80
                }
              ]}
              height={400}
              loading={false}
            />
          }
        ></SectionContainer>
      </div>

      {/* Language Modal */}
      <MyModal
        open={languageModalOpen}
        setOpen={setLanguageModalOpen}
        title={languageModalMode === 'add' ? 'Add New Language' : 'Edit Language'}
        size="22vw"
        bodyheight="38vh"
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Language Name"
              fieldName="languageName"
              fieldType="text"
              record={languageForm}
              setRecord={setLanguageForm}
              required
              width={300}
            />
            <MyInput
              fieldLabel="Language Code"
              fieldName="languageCode"
              fieldType="text"
              record={languageForm}
              setRecord={setLanguageForm}
              required
              width={300}
            />
            <MyInput
              fieldLabel="Direction"
              fieldName="direction"
              fieldType="select"
              selectData={[
                { key: 'LTR', lovDisplayVale: 'LTR' },
                { key: 'RTL', lovDisplayVale: 'RTL' }
              ]}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={languageForm}
              setRecord={setLanguageForm}
              required
              width={300}
              searchable={false}
            />
          </Form>
        }
      />

      {/* Language Value Modal */}
      <MyModal
        open={valueModalOpen}
        setOpen={setValueModalOpen}
        title="Add New Translation Value"
        size="24vw"
        bodyheight="52vh"
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Key"
              fieldName="key"
              fieldType="text"
              record={valueForm}
              setRecord={setValueForm}
              width={'100%'}
            />
            <MyInput
              fieldLabel="Value"
              fieldName="value"
              fieldType="textarea"
              record={valueForm}
              setRecord={setValueForm}
              width={'100%'}
            />
            <Form.Group>
              <Form.ControlLabel>Verify</Form.ControlLabel>
              <RadioGroup
                inline
                value={valueForm.verify}
                onChange={val => setValueForm(prev => ({ ...prev, verify: val }))}
              >
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </RadioGroup>
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Translate</Form.ControlLabel>
              <RadioGroup
                inline
                value={valueForm.translate}
                onChange={val => setValueForm(prev => ({ ...prev, translate: val }))}
              >
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </RadioGroup>
            </Form.Group>
          </Form>
        }
      />
    </div>
  );
};

export default LanguagesSetup;
