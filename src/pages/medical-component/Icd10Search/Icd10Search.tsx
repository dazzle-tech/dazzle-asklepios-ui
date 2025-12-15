import { useGetIcdListQuery, useGetIcdByIdQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import React, { useEffect, useState } from 'react';
import SearchIcon from '@rsuite/icons/Search';
import './styles.less';
import { Col, Dropdown, Input, InputGroup, Row, Text } from 'rsuite';

type Props = {
  object: any;
  setOpject: (val: any) => void;
  fieldName: string;
  label?: string;
  disabled?: boolean;
};

const Icd10Search: React.FC<Props> = ({
  object,
  setOpject,
  fieldName,
  label,
  disabled,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listIcdRequest, setListIcdRequest] = useState({
    ...initialListRequest,
    pageSize: 1000,
  });

  /** 🔹 List (search results) */
  const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);

  /** 🔹 Selected ICD by ID (solution 1) */
  const diagnosisId = object?.[fieldName];

  const { data: icdById } = useGetIcdByIdQuery(diagnosisId, {
    skip: !diagnosisId,
  });
  

  const modifiedData = (icdListResponseData?.object ?? []).map((item: any) => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`,
  }));

  /** 🔹 Handle search */
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
  };

  /** 🔹 Apply filters when searching */
  useEffect(() => {
    if (searchKeyword.trim() !== '') {
      setListIcdRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: searchKeyword,
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: searchKeyword,
          },
        ],
      });
    }
  }, [searchKeyword]);

  return (
    <>
      {/* 🔹 Search input */}
      <Row>
        <Text>{label ?? 'Diagnosis'}</Text>
        <Col md={24}>
          <div style={{ position: 'relative' }}>
            <InputGroup inside style={{ height: '32px' }}>
              <Input
                required
                placeholder="Search ICD-10"
                value={searchKeyword}
                onChange={handleSearch}
                disabled={disabled ?? false}
              />
              <InputGroup.Button>
                <SearchIcon />
              </InputGroup.Button>
            </InputGroup>

            {/* 🔹 Dropdown results */}
            {searchKeyword && modifiedData.length > 0 && (
              <div className="dropdown-list">
                <Dropdown.Menu>
                  {modifiedData.map((mod: any) => (
                    <Dropdown.Item
                      key={mod.key}
                      eventKey={mod.key}
                      onClick={() => {
                        setOpject({
                          ...object,
                          [fieldName]: mod.key,
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

      {/* 🔹 Selected ICD (always correct via byId API) */}
      <Row>
        <Col md={24}>
          <InputGroup style={{ height: '32px' }}>
            <Input
              disabled
              value={
                icdById
                  ? `${icdById.icdCode}, ${icdById.description}`
                  : ''
              }
            />
          </InputGroup>
        </Col>
      </Row>
    </>
  );
};

export default Icd10Search;
