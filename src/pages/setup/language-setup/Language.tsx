import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { faEdit, faInfo, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Form, Radio, RadioGroup } from 'rsuite';
import './styles.less';
import {
  useGetAllLanguagesQuery,
  useAddLanguageMutation,
  useUpdateLanguageMutation,
} from '@/services/setup/languageService';

import {
  useGetAllTranslationsQuery,
  useAddTranslationMutation,
  useUpdateTranslationMutation,
  useGetTranslationsByLangQuery,
} from '@/services/setup/translationService';
import { ApLanguages } from '@/types/model-types';
import { newLanguage, newLanguageTranslation } from '@/types/model-types-constructor-new';
import { Language, LanguageTranslation } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useEnumCapitalized } from '@/services/enumsApi';
import { set } from 'lodash';

const LanguagesSetup = () => {
  // States for Languages Table
  const [languages, setLanguages] = useState<Language>({ ...newLanguage });
  const [selectedLanguage, setSelectedLanguage] = useState<Language>({ ...newLanguage });
  const [valueForm, setValueForm] = useState<LanguageTranslation>({ ...newLanguageTranslation });
  const [selectedValue, setSelectedValue] = useState<LanguageTranslation>({ ...newLanguageTranslation });
  const dispatch = useAppDispatch();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [languageModalMode, setLanguageModalMode] = useState('add');

  const [valueModalOpen, setValueModalOpen] = useState(false);

  const handleAddLanguage = () => {
    setLanguageModalMode('add');
    setLanguages({ ...newLanguage });
    setLanguageModalOpen(true);
  };

  const handleEditLanguage = () => {
    if (!languages?.id) return;
    setLanguageModalMode('edit');
    setLanguages({ ...languages });
    setLanguageModalOpen(true);
  };

  const handleLanguageRowClick = rowData => {
    setLanguages(rowData);
    setValueForm({ ...newLanguageTranslation, langKey: rowData.langKey }) ; 
  };


  const handleEditLanguageTranslation = () => {
    if (!valueForm?.id) return;
    setValueForm({ ...valueForm , langKey: languages.langKey });
    setValueModalOpen(true);
  };

  const handleLanguageTranslationRowClick = rowData => {
    setValueForm(rowData);
  };

  // Language Values Handlers
  const handleAddValue = () => {
    setValueForm({ ...newLanguageTranslation, langKey: languages.langKey });
    setValueModalOpen(true);
  };


  
  const { data: langData, isFetching: langsLoading, refetch: refetchLangs } = useGetAllLanguagesQuery({});



  const {
  data: transData = [],          
  isFetching: transLoading,
  refetch: refetchTrans,
} = useGetTranslationsByLangQuery(
  languages?.langKey ?? '',     
  { skip: !languages?.langKey } 
);

  const directionOptions = useEnumCapitalized("Direction");

  // --- RTK: Mutations ---
  const [addLanguage, addLanguageState] = useAddLanguageMutation();
  const [updateLanguage, updateLanguageState] = useUpdateLanguageMutation();

  const [addTranslation, addTranslationState] = useAddTranslationMutation();
  const [updateTranslation, updateTranslationState] = useUpdateTranslationMutation(); 



  // Handle click on Save Language button
  const handleSave = async () => {
    try {
      setLanguageModalOpen(false);
      if (languages?.id) {
        await updateLanguage({ ...languages }).unwrap().then(() => {
          dispatch(notify({ msg: 'The language has been updated successfully', sev: 'success' }));
        });
        refetchLangs();
      } else {
        await addLanguage({ ...languages }).unwrap().then(() => {
          dispatch(notify({ msg: 'The language has been saved successfully', sev: 'success' }));
        });
        refetchLangs();
      }
    } catch (error) {
      dispatch(notify({ msg: 'Failed to save this language', sev: 'error' }));
    }
  };

  
  // Handle click on Save Language button
  const handleSaveTranslation = async () => {
    try {
      setValueModalOpen(false);
      if (valueForm?.id) {
        await updateTranslation({ ...valueForm }).unwrap().then(() => {
          dispatch(notify({ msg: 'The Translation has been updated successfully', sev: 'success' }));
        });
        refetchTrans();
      } else {
        await addTranslation({ ...valueForm, originalText: valueForm?.translationKey }).unwrap().then(() => {
          dispatch(notify({ msg: 'The Translation has been saved successfully', sev: 'success' }));
        });
        refetchTrans();
      }
    } catch (error) {
      dispatch(notify({ msg: 'Failed to save this translation', sev: 'error' }));
    }
  };

useEffect(() => {
  if (languages?.langKey) {
    refetchTrans();           
  }
}, [languages?.langKey, refetchTrans]);

  // Language Table Buttons
  const languageTableButtons = (
    <div className="flex-10">
      <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={handleAddLanguage}>
        New
      </MyButton>
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}
        onClick={handleEditLanguage}
        disabled={!languages?.id}
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
        disabled={!languages?.id}
      >
        New
      </MyButton>
        <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}
        onClick={handleEditLanguageTranslation}
        disabled={!valueForm?.id}
      >
        Edit
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
              data={langData ?? []}
              columns={[
                {
                  key: 'langName',
                  title: 'Language Name',
                  dataKey: 'langName',
                  width: 150
                },
                {
                  key: 'langKey',
                  title: 'Language Code',
                  dataKey: 'langKey',
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
                languages?.id === rowData.id ? 'selected-row' : ''
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
              data={transData ?? []}
              columns={[
                {
                  key: 'translationKey',
                  title: 'Key',
                  dataKey: 'translationKey',
                  width: 200
                },
                {
                  key: 'translationText',
                  title: 'Value',
                  dataKey: 'translationText',
                  width: 200
                },
                {
                  key: 'verified',
                  title: 'Verify',
                  dataKey: 'verified',
                  width: 80
                },
                {
                  key: 'translated',
                  title: 'Translate',
                  dataKey: 'translated',
                  width: 80
                }
              ]}
              height={400}
              loading={false}
              onRowClick={handleLanguageTranslationRowClick}
              rowClassName={rowData =>
                valueForm?.id === rowData.id ? 'selected-row' : ''
              }
            />
          }
        ></SectionContainer>
      </div>

      {/* Language Modal */}
      <MyModal
        open={languageModalOpen}
        setOpen={setLanguageModalOpen}
        title={languageModalMode === 'add' ? 'Add New Language' : 'Edit Language'}
        actionButtonFunction={handleSave}
        size="22vw"
        bodyheight="38vh"
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Language Name"
              fieldName="langName"
              fieldType="text"
              record={languages}
              setRecord={setLanguages}
              required
              width={300}
            />
            <MyInput
              fieldLabel="Language Code"
              fieldName="langKey"
              fieldType="text"
              disabled={languages?.id ? true : false}
              record={languages}
              setRecord={setLanguages}
              required
              width={300}
            />
            <MyInput
              required
              column
              fieldLabel="Direction"
              fieldType="select"
              fieldName="direction"
              selectData={directionOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={languages}
              setRecord={setLanguages}
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
        title={valueForm?.id ? 'Add New Translation Value' : 'Edit Translation Value'}
        size="24vw"
        bodyheight="52vh"
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Key"
              fieldName="translationKey"
              fieldType="text"
              disabled={valueForm?.id ? true : false}
              record={valueForm}
              setRecord={setValueForm}
              width={'100%'}
            />
            <MyInput
              fieldLabel="Value"
              fieldName="translationText"
              fieldType="textarea"
              record={valueForm}
              setRecord={setValueForm}
              width={'100%'}
            />
            <Form.Group>
              <Form.ControlLabel>Verify</Form.ControlLabel>
              <RadioGroup
                inline
                value={valueForm.verified ? 'Y' : 'N'}
                onChange={val => setValueForm(prev => ({ ...prev, verified: val === 'Y' }))}
              >
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </RadioGroup>
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Translate</Form.ControlLabel>
              <RadioGroup
                inline
                value={valueForm.translated ? 'Y' : 'N'}
                onChange={val => setValueForm(prev => ({ ...prev, translated: val === 'Y' }))}
              >
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </RadioGroup>
            </Form.Group>
          </Form>
        }
        actionButtonFunction={handleSaveTranslation}
      />
    </div>
  );
};

export default LanguagesSetup;
