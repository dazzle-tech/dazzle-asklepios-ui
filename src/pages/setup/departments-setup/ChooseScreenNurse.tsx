import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect } from 'react';
import {
   useBulkSaveNurseMedicalSheetsMutation,
  useGetNurseMedicalSheetsByDepartmentQuery,
} from '@/services/MedicalSheetsService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import './styles.less';
import { MedicalSheets } from '@/config/modules-config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSheetPlastic } from '@fortawesome/free-solid-svg-icons';

const ChooseScreenNurse = ({
  open,
  setOpen,
  width,
  department,
  showScreen,
  setShowScreen,
}) => {
   const dispatch = useDispatch();

 
  const { data: departmentSheets = [], isLoading } =useGetNurseMedicalSheetsByDepartmentQuery(department?.id, { skip: !department?.id});
   console.log("id",department?.id)
   console.log("sheets",departmentSheets)
  const [bulkSaveMedicalSheets] = useBulkSaveNurseMedicalSheetsMutation();


 
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
          <div className="container-of-specific-sheets">
            <h6>Medical Sheets</h6>

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
          </div>

          {/* Specialty Sheets */}
          <div className="container-of-specific-sheets">
            <h6>Specialty Sheets</h6>

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
          </div>
        </div>
      )}
    </Form>
  );

 
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="  Nurse Medical Sheets"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      size={width > 600 ? '40vw' : '25vw'}
      steps={[
        {
          title: 'Medical Sheets',
          icon: <FontAwesomeIcon icon={faSheetPlastic} />,
        },
      ]}
    />
  );
  
};

export default ChooseScreenNurse;
