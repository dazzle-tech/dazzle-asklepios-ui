import { useGetIcdListQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import React, { useEffect, useState } from 'react';
import SearchIcon from '@rsuite/icons/Search';
import './styles.less';
import { Col, Dropdown, Input, InputGroup, Row, Text } from 'rsuite';

const Icd10Search = ({ object, setOpject, fieldName, ...props }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest, pageSize: 1000 });
  const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);

  const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));

  const handleSearch = value => setSearchKeyword(value);

  const selectedItem = modifiedData.find(item => item.key === object?.[fieldName]);
  useEffect(() => {
    if (searchKeyword.trim() !== '') {
      setListIcdRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: searchKeyword
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: searchKeyword
          }
        ]
      });
    }
  }, [searchKeyword]);
  return (
    <>
      <Row>
        <Text>{props?.label ? props?.label : 'Diagnosis'}</Text>
        <Col md={24}>
          <div style={{ position: 'relative' }}>
            <InputGroup style={{ height: '32px' }} inside>
              <Input
                placeholder="Search ICD-10"
                value={searchKeyword}
                onChange={handleSearch}
                disabled={props?.disabled ? props?.disabled : false}
              />
              <InputGroup.Button style={{ height: '32px' }}>
                <SearchIcon />
              </InputGroup.Button>
            </InputGroup>

            {searchKeyword && (
              <div className="dropdown-list">
                <Dropdown.Menu>
                  {modifiedData.map(mod => (
                    <Dropdown.Item
                      key={mod.key}
                      eventKey={mod.key}
                      onClick={() => {
                        setOpject({
                          ...object,
                          [fieldName]: mod.key
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
          <InputGroup style={{ height: '32px' }}>
            <Input
              disabled
              value={selectedItem ? `${selectedItem.icdCode}, ${selectedItem.description}` : ''}
            />
          </InputGroup>
        </Col>
      </Row>
    </>
  );
};

export default Icd10Search;
