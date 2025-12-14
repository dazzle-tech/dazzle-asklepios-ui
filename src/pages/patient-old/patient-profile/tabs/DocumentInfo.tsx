import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';

const DocumentInfo = ({
 validationResult,
 localPatient,
 setLocalPatient,
 docTypeLovQueryResponse,
 countryLovQueryResponse,
}) => {
  return (
    <Form layout="inline">
                    <MyInput
                      vr={validationResult}
                      column
                      fieldLabel="Document Type"
                      fieldType="select"
                      fieldName="documentTypeLkey"
                      selectData={docTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                      searchable={false}
                    />
                    <MyInput
                      // required
                      vr={validationResult}
                      column
                      fieldLabel="Document Country"
                      fieldType="select"
                      fieldName="documentCountryLkey"
                      selectData={countryLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={localPatient}
                      setRecord={setLocalPatient}
                      disabled={localPatient.documentTypeLkey === 'NO_DOC'}
                      menuMaxHeight={200}
                    />
                    <MyInput
                      // required
                      vr={validationResult}
                      column
                      fieldLabel="Document Number"
                      fieldName="documentNo"
                      record={localPatient}
                      setRecord={setLocalPatient}
                      disabled={localPatient.documentTypeLkey === 'NO_DOC'}
                    />
                  </Form>
  );
};

export default DocumentInfo;
