import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SectionContainer from '@/components/SectionsoContainer';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetDepartmentServicesQuery,
  useReplaceDepartmentServicesMutation,
} from '@/services/departmentServicesService';
import { MdHomeRepairService } from "react-icons/md";
const AddServiceToDepartment = ({ open, setOpen, width, department, showScreen, setShowScreen }) => {
  const dispatch = useDispatch();
  const { data: departmentServices = [], isLoading } =
    useGetDepartmentServicesQuery(
      { departmentId: department?.id },
      { skip: !department?.id }
    );

  const [replaceDepartmentServices] = useReplaceDepartmentServicesMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const services = useEnumOptions('EncounterReason');
  const filteredServices = services.filter(s =>
    s.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
 

  useEffect(() => {
    if (!department?.id || isLoading) return;

    if (!departmentServices.length) {
      setShowScreen({});
      return;
    }

    const initial = departmentServices.reduce((a, i) => {
      a[i.service] = true;
      return a;
    }, {});
    setShowScreen(initial);
  }, [departmentServices, department?.id, isLoading]);

  const handleSelectAll = (list, checked) => {
    const updated = { ...showScreen };
    list.forEach(service => {
      updated[service.value] = checked;
    });
    setShowScreen(updated);
  };

  const handleSave = async () => {
    try {
      const selectedServices = Object.entries(showScreen)
        .filter(([_, checked]) => checked)
        .map(([code]) => String(code));

      await replaceDepartmentServices({
        departmentId: department.id,
        services: selectedServices,
      }).unwrap();

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setOpen(false);
      setSearchTerm('');
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
              placeholder="Search services..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sheets-columns">
            <div className="sheets-column">
              <SectionContainer
                title="Services"
                content={
                  <div className="sheets-content">
                    <MyInput
                      fieldType="check"
                      fieldLabel="Select All"
                      fieldName="selectAllDefault"
                      showLabel={false}
                      record={{
                        selectAllDefault: filteredServices.every(
                          s => showScreen[s.value]
                        ),
                      }}
                      setRecord={() =>
                        handleSelectAll(
                          filteredServices,
                          !filteredServices.every(s => showScreen[s.value])
                        )
                      }
                    />
                    <div className="sheets-list">
                      {filteredServices.map(sheet => (
                        <MyInput
                          key={sheet.value}
                          fieldType="check"
                          fieldName={sheet.value}
                          fieldLabel={sheet.label}
                          showLabel={false}
                          record={{ [sheet.value]: !!showScreen[sheet.value] }}
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
      title="Services"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      size={width > 600 ? '45vw' : '25vw'}
      steps={[
        {
          title: 'Services',
          icon: <MdHomeRepairService />,
        },
      ]}
    />
  );
};

export default AddServiceToDepartment;
