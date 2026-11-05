import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useSearchIcd10Query } from '@/services/setup/icd10service';
import SearchIcon from '@rsuite/icons/Search';
import React, { useState } from 'react';
import { Col, Dropdown, Form, Input, InputGroup, Row, Text } from 'rsuite';
import '../styles.less';

type DiagnosisProps = {
  record: any;
  setRecord: (record: any) => void;
};

const Diagnosis: React.FC<DiagnosisProps> = ({ record, setRecord }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const keyword = searchKeyword.trim();
  const { data: icdResponse } = useSearchIcd10Query(
    { keyword, page: 0, size: 50 },
    { skip: !keyword }
  );

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
                      onChange={setSearchKeyword}
                    />
                    <InputGroup.Button>
                      <SearchIcon />
                    </InputGroup.Button>
                  </InputGroup>

                  {keyword && (
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
                        {(icdResponse?.data ?? []).map((icd: any) => (
                          <Dropdown.Item
                            key={icd.id}
                            eventKey={icd.id}
                            onClick={() => {
                              setRecord({
                                ...record,
                                diagnosisIcdId: icd.id,
                                diagnosisDescription: `${icd.code}, ${icd.description}`
                              });
                              setSearchKeyword('');
                            }}
                          >
                            <span>{icd.code}</span>
                            <span>&nbsp;&nbsp;</span>
                            <span>{icd.description}</span>
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
                  <Input disabled value={record?.diagnosisDescription ?? ''} />
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
                record={record}
                setRecord={setRecord}
              />
            </Form>
          </Col>
        </Row>
      }
    />
  );
};
export default Diagnosis;
