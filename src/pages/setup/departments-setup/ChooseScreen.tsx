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
import { faSheetPlastic } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MedicalSheets } from '@/config/modules-config';
import SectionContainer from '@/components/SectionsoContainer';

const ChooseDepartment = ({ open, setOpen, width, department ,showScreen, setShowScreen}) => {
  const dispatch = useDispatch();

 
  const { data: departmentSheets = [], isLoading } =
    useGetMedicalSheetsByDepartmentQuery(department?.id, { skip: !department?.id});
   console.log("id",department?.id)
   console.log("sheets",departmentSheets)
  const [bulkSaveMedicalSheets] = useBulkSaveMedicalSheetsMutation();


 
 useEffect(()=>{
  console.log("show",showScreen)
 },[])

useEffect(() => {
  if (!department?.id) return;

  // انتظر تحميل البيانات من RTK Query
  if (isLoading) return;

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

      console.log("SELECTED",selectedSheets)
      await bulkSaveMedicalSheets(selectedSheets).unwrap();
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setOpen(false);
    } catch (error) {
      dispatch(notify({ msg: 'Save failed', sev: 'error' }));
    }
  };

  // ✅ محتوى المودال
  const conjureFormContent = () => (
    <Form layout="inline" fluid>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="container-of-medical-sheets grid grid-cols-2 gap-4">
          {/* Default Sheets */}

          <SectionContainer title="Medical Sheets"
          content={
          <div className="container-of-specific-sheets">
            <MyInput
              fieldType="check"
              fieldLabel="Select All"
              fieldName="selectAllDefault"
              showLabel={false}
              record={{
                selectAllDefault: defaultSheets.every(s => showScreen[s.code]),
              }}
              setRecord={() =>
                handleSelectAll(
                  defaultSheets,
                  !defaultSheets.every(s => showScreen[s.code])
                )
              }
            />

            <div className="sheets">
              {defaultSheets.map(sheet => (
                <MyInput
                  key={sheet.code}
                  fieldType="check"
                  fieldName={sheet.code}
                  fieldLabel={
                    <>
                      {sheet.icon}
                      <span style={{ marginLeft: 8 }}>{sheet.name}</span>
                    </>
                  }
                  showLabel={false}
                  record={{ [sheet.code]: !!showScreen[sheet.code] }}
                  setRecord={(newRecord) =>
  setShowScreen(prev => ({ ...prev, ...newRecord }))
} 
                />
              ))}
            </div>
          </div>}/>

          {/* Specialty Sheets */}
          <SectionContainer title="Specialty Sheets"
          content={
          <div className="container-of-specific-sheets">
            <MyInput
              fieldType="check"
              fieldLabel="Select All"
              fieldName="selectAllSpecialty"
              showLabel={false}
              record={{
                selectAllSpecialty: specialtySheets.every(
                  s => showScreen[s.code]
                ),
              }}
              setRecord={() =>
                handleSelectAll(
                  specialtySheets,
                  !specialtySheets.every(s => showScreen[s.code])
                )
              }
            />

            <div className="sheets">
              {specialtySheets.map(sheet => (
                <MyInput
                  key={sheet.code}
                  fieldType="check"
                  fieldName={sheet.code}
                  fieldLabel={
                    <>
                      {sheet.icon}
                      <span style={{ marginLeft: 8 }}>{sheet.name}</span>
                    </>
                  }
                  showLabel={false}
                  record={{ [sheet.code]: !!showScreen[sheet.code] }}
                  setRecord={(newRecord) =>
  setShowScreen(prev => ({ ...prev, ...newRecord }))
} 
                />
              ))}
            </div>
          </div>}/>
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
