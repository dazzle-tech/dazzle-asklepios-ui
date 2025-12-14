import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { useSavePostProcedureCareMutation } from '@/services/procedureService';
import { useGetIcdListQuery } from '@/services/setupService';
import { newApPostProcedureCare } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import SearchIcon from '@rsuite/icons/Search';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Col, Dropdown, Form, Input, InputGroup, Row, Text } from 'rsuite';
import '../styles.less';
export type DiagRef = {
  handleSave: () => void;
};
type DiagnosisProps = {
  procedure: any;
  user: any;
};
const Diagnosis = forwardRef<DiagRef, DiagnosisProps>(({ procedure, user }, ref) => {
  const dispatch = useAppDispatch();
  const [diagno, setDiagno] = useState({ ...newApPostProcedureCare });
  const [saveProcedureCare] = useSavePostProcedureCareMutation();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest, pageSize: 1000 });
  const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
  const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));
  const handleSave = async () => {
    try {
      const response = await saveProcedureCare({
        ...diagno,
        procedureKey: procedure?.key,
        createdBy: user?.key
      }).unwrap();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      console.error('Error saving procedure care:', error);
      dispatch(notify({ msg: 'Error saving procedure care', sev: 'error' }));
    }
  };
  useImperativeHandle(ref, () => ({
    handleSave
  }));
  const handleSearch = value => {
    setSearchKeyword(value);
  };
  return (
    <SectionContainer
      title={<Text>Procedure Care</Text>}
      content={
        <Row>
          <Col md={12}>
            <Row>
              <Col md={24}>
                <Text>Diagnosis</Text>

                <div style={{ position: 'relative' }}>
                  <InputGroup inside>
                    <Input
                      placeholder="Search ICD-10"
                      value={searchKeyword}
                      onChange={handleSearch}
                    />
                    <InputGroup.Button>
                      <SearchIcon />
                    </InputGroup.Button>
                  </InputGroup>

                  {searchKeyword && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        zIndex: 9999,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        marginTop: '4px'
                      }}
                    >
                      <Dropdown.Menu>
                        {modifiedData?.map(mod => (
                          <Dropdown.Item
                            key={mod.key}
                            eventKey={mod.key}
                            onClick={() => {
                              setDiagno({
                                ...diagno,
                                diagnoseKey: mod.key
                              });
                              setSearchKeyword('');
                            }}
                          >
                            <span>{mod.icdCode}</span>
                            <span>&nbsp;&nbsp;</span>
                            <span>{mod.description}</span>
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={24}>
                <InputGroup>
                  <Input
                    disabled={true}
                    value={
                      diagno?.diagnoseKey
                        ? `${
                            modifiedData?.find(item => item.key === diagno?.diagnoseKey)?.icdCode
                          }, ${
                            modifiedData?.find(item => item.key === diagno?.diagnoseKey)
                              ?.description
                          }`
                        : ''
                    }
                  />
                </InputGroup>
              </Col>
            </Row>
          </Col>
          <Col md={12}>
            <Form fluid>
              <MyInput
                width="100%"
                fieldType="textarea"
                fieldName="patientCondition"
                record={diagno}
                setRecord={setDiagno}
              />
            </Form>
          </Col>
        </Row>
      }
    />
  );
});
export default Diagnosis;
