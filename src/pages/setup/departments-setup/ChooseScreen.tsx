import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import {
  useBulkSaveMedicalSheetsMutation,
  useGetMedicalSheetsByDepartmentQuery,
} from '@/services/MedicalSheetsService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import { faSheetPlastic, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MedicalSheets } from '@/config/modules-config';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';

const ChooseDepartment = ({ open, setOpen, width, department, showScreen, setShowScreen }) => {
  const dispatch = useDispatch();
  const { data: departmentSheets = [], isLoading } =
    useGetMedicalSheetsByDepartmentQuery(department?.id, { skip: !department?.id });
  const [bulkSaveMedicalSheets] = useBulkSaveMedicalSheetsMutation();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!department?.id || isLoading) return;

    if (!departmentSheets.length) {
      setShowScreen({});
      return;
    }

    const initial = departmentSheets.reduce((a, i) => {
      a[i.medicalSheet] = true;
      return a;
    }, {});
    setShowScreen(initial);
  }, [departmentSheets, department?.id, isLoading]);

  const specialtySheets = MedicalSheets.filter(s => s.type === 'Specialty');
  const defaultSheets = MedicalSheets.filter(s => !s.type || s.type === 'Default');

  const filteredDefaultSheets = defaultSheets.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSpecialtySheets = specialtySheets.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (list, checked) => {
    const updated = { ...showScreen };
    list.forEach(sheet => {
      updated[sheet.code] = checked;
    });
    setShowScreen(updated);
  };

  const handleSave = async () => {
    try {
      const selectedSheets = Object.entries(showScreen)
        .filter(([_, checked]) => checked)
        .map(([code]) => ({
          departmentId: department.id,
          medicalSheet: code.toUpperCase(),
        }));

      await bulkSaveMedicalSheets(selectedSheets).unwrap();

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setOpen(false);
      setSearchTerm('')
    } catch (error) {
      dispatch(notify({ msg: 'Save failed', sev: 'error' }));
    }
  };

  const conjureFormContent = () => (
    <Form layout="inline" fluid>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="medical-sheets-wrapper">
          {/* Search Input */}
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search medical sheets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Columns */}
          <div className="sheets-columns">
            {/* Default Sheets */}
            <div className="sheets-column">
              <SectionContainer
                title="Medical Sheets"
                content={
                  <div className="sheets-content">
                    <MyInput
                      fieldType="check"
                      fieldLabel="Select All"
                      fieldName="selectAllDefault"
                      showLabel={false}
                      record={{
                        selectAllDefault: filteredDefaultSheets.every(
                          s => showScreen[s.code]
                        ),
                      }}
                      setRecord={() =>
                        handleSelectAll(
                          filteredDefaultSheets,
                          !filteredDefaultSheets.every(s => showScreen[s.code])
                        )
                      }
                    />
                    <div className="sheets-list">
                      {filteredDefaultSheets.map(sheet => (
                        <MyInput
                          key={sheet.code}
                          fieldType="check"
                          fieldName={sheet.code}
                          fieldLabel={
                            <div className="sheet-item">
                              {sheet.icon}
                              <span>{sheet.name}</span>
                            </div>
                          }
                          showLabel={false}
                          record={{ [sheet.code]: !!showScreen[sheet.code] }}
                          setRecord={newRecord =>
                            setShowScreen(prev => ({ ...prev, ...newRecord }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                }
              />
            </div>

            {/* Specialty Sheets */}
            <div className="sheets-column">
              <SectionContainer
                title="Specialty Sheets"
                content={
                  <div className="sheets-content">
                    <MyInput
                      fieldType="check"
                      fieldLabel="Select All"
                      fieldName="selectAllSpecialty"
                      showLabel={false}
                      record={{
                        selectAllSpecialty: filteredSpecialtySheets.every(
                          s => showScreen[s.code]
                        ),
                      }}
                      setRecord={() =>
                        handleSelectAll(
                          filteredSpecialtySheets,
                          !filteredSpecialtySheets.every(s => showScreen[s.code])
                        )
                      }
                    />
                    <div className="sheets-list">
                      {filteredSpecialtySheets.map(sheet => (
                        <MyInput
                          key={sheet.code}
                          fieldType="check"
                          fieldName={sheet.code}
                          fieldLabel={
                            <div className="sheet-item">
                              {sheet.icon}
                              <span>{sheet.name}</span>
                            </div>
                          }
                          showLabel={false}
                          record={{ [sheet.code]: !!showScreen[sheet.code] }}
                          setRecord={newRecord =>
                            setShowScreen(prev => ({ ...prev, ...newRecord }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      )}
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Medical Sheets"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      size={width > 600 ? '45vw' : '25vw'}
      steps={[
        {
          title: 'Medical Sheets',
          icon: <FontAwesomeIcon icon={faSheetPlastic} />,
        },
      ]}
    />
  );
};

export default ChooseDepartment;
