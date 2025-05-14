import React, { useState, useEffect } from 'react';
import { Dropdown, Input, InputGroup, Text } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetDiagnosticsTestListQuery } from '@/services/setupService';
import './styles.less';
import MyLabel from '@/components/MyLabel';
const TestDropdown = ({  handleItemClick, disabled ,flag,setFlag }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [listTestRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const { data: testsList } = useGetDiagnosticsTestListQuery(listTestRequest);
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setListRequest(
                {
                    ...initialListRequest,

                    filters: [
                        {
                            fieldName: 'test_name',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        }

                    ]
                }
            );
        }
    }, [searchKeyword]);
    useEffect
(() => {
        if (flag) {
            setSearchKeyword('');
            setListRequest({ ...initialListRequest });
            setFlag(false)
        }
    }, [flag]);
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    

    return (<div>
       
        <InputGroup inside className='input-search'>
            <Input
                disabled={disabled}
                placeholder={'Search Test '}
                value={searchKeyword}
                onChange={handleSearch}
            />
            <InputGroup.Button>
                <SearchIcon />
            </InputGroup.Button>
        </InputGroup>
        {searchKeyword && (
            <Dropdown.Menu
                style={{
                    position: 'absolute',
                    zIndex: 9999,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
                }}
            >
                {testsList && testsList?.object?.map(test => (
                    <Dropdown.Item
                        key={test.key}
                        eventKey={test.key}
                        onClick={() => handleItemClick(test)}

                    >
                        <span style={{ marginRight: "19px" }}>{test.testName}</span>
                        <span>{test?.testTypeLvalue?.lovDisplayVale}</span>
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        )}


    </div>);
};

export default TestDropdown;
