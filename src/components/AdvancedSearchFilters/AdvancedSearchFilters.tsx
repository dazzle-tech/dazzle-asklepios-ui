import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faMagnifyingGlassPlus,
  faBroom
} from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Form } from 'rsuite';
import MyButton from '../MyButton/MyButton';
import MyInput from '../MyInput';
import './styles.less';

const AdvancedSearchFilters = ({ searchFilter = true }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [record, setRecord] = useState({});

  //
  const { data: bookVisitLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
  const { data: EncPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');

  const priorityData = [
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' }
  ];

  return (
    <>
      <div className="bt-right-group">
        <MyButton appearance="ghost" onClick={() => setShowAdvanced(!showAdvanced)}>
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
          Advance
        </MyButton>

        {searchFilter && (
          <MyButton prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}>
            Search
          </MyButton>
        )}

        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}>Clear</MyButton>

        {/* Advanced Filters */}
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <Form fluid className="dissss">
            {/* Visit Type LOV */}
            <MyInput
              fieldName="accessTypeLkey"
              fieldType="select"
              selectData={bookVisitLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              fieldLabel="Visit Type"
              selectDataValue="key"
              record={record}
              setRecord={setRecord}
              searchable={false}
            />
            {/* Chief Complain Text */}
            <MyInput
              fieldName="chiefComplain"
              fieldType="text"
              record={record}
              setRecord={setRecord}
              fieldLabel="Chief Complain"
            />
            {/* Checkboxes*/}
            <MyInput
              fieldName="withPrescription"
              fieldType="checkbox"
              record={record}
              setRecord={setRecord}
              label="With Prescription"
            />
            <MyInput
              fieldName="hasOrders"
              fieldType="checkbox"
              record={record}
              setRecord={setRecord}
              label="Has Orders"
            />
            <MyInput
              fieldName="isObserved"
              fieldType="checkbox"
              record={record}
              setRecord={setRecord}
              label="Is Observed"
            />
            {/* Priority LOV */}
            <MyInput
              fieldName="priority"
              fieldType="select"
              record={record}
              setRecord={setRecord}
              selectData={EncPriorityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              placeholder="Select Priority"
              fieldLabel="Priority"
              searchable={false}
            />
          </Form>
        </div>
      )}
    </>
  );
};

export default AdvancedSearchFilters;
