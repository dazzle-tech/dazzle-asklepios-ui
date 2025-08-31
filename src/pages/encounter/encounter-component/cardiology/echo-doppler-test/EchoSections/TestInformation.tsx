import React from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import '../style.less';

interface Props {
  echoTest: any;
  setEchoTest: React.Dispatch<React.SetStateAction<any>>;
  physicians: Array<any>;
  usersList: Array<any>;
}

const TestInformation: React.FC<Props> = ({
  echoTest,
  setEchoTest,
  physicians,
  usersList
}) => {
  const { data: echoIndicationsLov } = useGetLovValuesByCodeQuery('ECHO_INDICATIONS');
  const { data: echoTypesLov } = useGetLovValuesByCodeQuery('ECHO_TYPES');

  const otherIndicationKey = 'OTHER';

  return (
    <Section
      title="Test Information"
      content={
        <div className="handle-inputs-positions-size">
          <MyInput
            width={200}
            fieldType="select"
            fieldLabel="Indication"
            fieldName="indication"
            selectData={echoIndicationsLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={echoTest}
            setRecord={setEchoTest}
            searchable={false}
          />
          {echoTest?.indication === otherIndicationKey && (
            <MyInput
              width={300}
              fieldType="text"
              fieldLabel="Other Indication"
              fieldName="indicationOther"
              placeholder="Please specify"
              record={echoTest}
              setRecord={setEchoTest}
              searchable={false}
            />
          )}
          <MyInput
            width={200}
            fieldType="select"
            fieldLabel="Echo Type"
            fieldName="echoType"
            selectData={echoTypesLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={echoTest}
            setRecord={setEchoTest}
            searchable={false}
          />
          <MyInput
            width={300}
            fieldType="select"
            fieldLabel="Referring Physician"
            fieldName="referringPhysician"
            selectData={physicians}
            selectDataLabel="fullName"
            selectDataValue="id"
            record={echoTest}
            setRecord={setEchoTest}
            searchable={false}
          />
          <MyInput
            width={300}
            fieldType="select"
            fieldLabel="Technician/Operator Name"
            fieldName="technicianName"
            selectData={usersList}
            selectDataLabel="fullName"
            selectDataValue="id"
            record={echoTest}
            setRecord={setEchoTest}
            searchable={false}
          />
        </div>
      }
    />
  );
};

export default TestInformation;
