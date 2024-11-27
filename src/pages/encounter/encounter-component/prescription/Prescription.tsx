import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import PageIcon from '@rsuite/icons/Page';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    Table,
    Modal,
    Stack,
    Divider,
    Radio,
    RadioGroup,
    TagInput,
    TagGroup,
    Tag
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { Toggle } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import BlockIcon from '@rsuite/icons/Block';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { object } from 'prop-types';
const Prescription = () => {
    const patientSlice = useAppSelector(state => state.patient);
    const dispatch = useAppDispatch();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedOption, setSelectedOption] = useState('Custome Instructions');
    const [tags, setTags] = React.useState([]);
    const [typing, setTyping] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true
      });
      const [selectedRows, setSelectedRows] = useState([]);
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
    const { data: FrequencyLovQueryResponse } = useGetLovValuesByCodeQuery('MED_FREQUENCY');
    const { data: DurationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');
    const { data: administrationInstructionsLovQueryResponse } = useGetLovValuesByCodeQuery('PRESC_INSTRUCTIONS');
    const handleSearch = value => {
        setSearchKeyword(value);
        console.log('serch' + searchKeyword);

    };
    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'containsIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const handleCheckboxChange = (key) => {
        setSelectedRows((prev) => {
            if (prev.includes(key)) {
                return prev.filter(item => item !== key);
            } else {
                return [...prev, key];
            }
        });
    };
    const removeTag = tag => {
        const nextTags = tags.filter(item => item !== tag);
        setTags(nextTags);
    };
 
    const addTag = () => {
        const nextTags = inputValue ? [...tags, inputValue] : tags;
        setTags(nextTags);
        setTyping(false);
        setInputValue('');
    };

    const handleButtonClick = () => {
        setTyping(true);
    };

    const renderInput = () => {
        if (typing) {
            return (
                <Input
                    className="tag-input"
                    size="xs"
                    style={{ width: 70 }}
                    value={inputValue}
                    onChange={setInputValue}
                    onBlur={addTag}
                    onPressEnter={addTag}
                />
            );
        }

        return (
            <IconButton
                className="tag-add-btn"
                onClick={handleButtonClick}
                icon={<PlusIcon />}
                appearance="ghost"
                size="xs"
            />
        );
    };
    return (<>
        <h5 style={{ marginTop: "10px" }}>Create Prescription</h5>
        <div className='top-container-p'>
            <div className='form-search-container-p '>
                <Form>
                    <Text>Medication Name</Text>
                    <InputGroup inside className='input-search-p'>
                        <Input
                            placeholder={'Search'}
                            value={searchKeyword}
                            onChange={handleSearch}
                        />
                        <InputGroup.Button>
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                    {/* {searchKeyword && (
                            <Dropdown.Menu className="dropdown-menuresult">
                                {testsList && testsList?.object?.map(test => (
                                    <Dropdown.Item
                                        key={test.key}
                                        eventKey={test.key}
                                        onClick={() => handleItemClick(test)}

                                    >
                                        <span style={{ marginRight: "19px" }}>{test.testName}</span>
                                        <span>{test.testTypeLvalue.lovDisplayVale}</span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        )} */}



                </Form>
            </div>
            <div className="buttons-sect-p">
            <IconButton
                    color="cyan"
                    appearance="ghost"

                    icon={<PlusIcon />}

                >
                    <Translate> Add Prescription</Translate>
                </IconButton> 
                <IconButton
                    color="violet"
                    appearance="primary"
                    // onClick={handleSubmit}
                    // disabled={selectedRows.length === 0}
                    icon={<CheckIcon />}
                >
                    <Translate>Submit</Translate>
                </IconButton>
                <IconButton
                    color="cyan"
                    appearance="primary"

                    icon={<PageIcon />}
                >
                    <Translate> Print Prescription</Translate>
                </IconButton>
              
             

            </div>
        </div>
        <div className='instructions-container-p '>
            <div className='instructions-container-p ' style={{ minWidth: "800px", border: " 1px solid #b6b7b8" }}>
                <div>
                    <RadioGroup name="radio-group" defaultValue="Custome Instructions" onChange={(value) => setSelectedOption(String(value))} >
                        <Radio value="Pre-defined Instructions">Pre-defined Instructions</Radio>
                        <Radio value="Manual instructions">Manual instructions</Radio>
                        <Radio value="Custome Instructions">Custome Instructions</Radio>
                    </RadioGroup>
                </div>
                <div style={{ marginLeft: "15px" }}>
                    {selectedOption === "Custome Instructions" &&
                        <div className='form-search-container-p '>
                            <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                                <MyInput
                                    column
                                    disabled={false}
                                    width={150}

                                    fieldName={'Dose'}
                                    record={{}}
                                    setRecord={""}
                                />

                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Unit"
                                    selectData={unitLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'Unit'}
                                    record={{}}
                                    setRecord={""}
                                />
                                <MyInput
                                    column
                                    disabled={true}
                                    width={150}
                                    fieldType="select"
                                    fieldLabel="ROA"
                                    selectData={[]}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'ROA'}
                                    record={{}}
                                    setRecord={""}
                                />
                            </Form>
                            <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Frequency"
                                    selectData={FrequencyLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'Frequency'}
                                    record={{}}
                                    setRecord={""}
                                />

                                <MyInput
                                    column
                                    disabled={false}
                                    width={150}
                                    fieldLabel="Duration"
                                    fieldName={'Duration'}
                                    record={{}}
                                    setRecord={""}
                                />
                                <MyInput
                                    column

                                    width={150}
                                    fieldType="select"
                                    fieldLabel="Duration type"
                                    selectData={DurationTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'Duration type'}
                                    record={{}}
                                    setRecord={""}
                                />
                            </Form>
                        </div>
                    }
                    {selectedOption === "Pre-defined Instructions" &&
                        <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                            <MyInput
                                column

                                width={250}
                                fieldType="select"
                                fieldLabel="Pre-defined Instructions"
                                selectData={[]}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                fieldName={'instruction'}
                                record={{}}
                                setRecord={""}
                            />
                        </Form>
                    }
                    {selectedOption === "Manual instructions" &&
                        <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                            <MyInput
                                column
                                disabled={false}
                                rows={5}
                                fieldType="textarea"
                                width={250}
                                fieldLabel="Manual instructions"
                                fieldName={'inst'}
                                record={{}}
                                setRecord={""}
                            />
                        </Form>
                    }
                </div>
            </div>
            <div className='form-search-container-p ' style={{ border: " 1px solid #b6b7b8", padding: "10px", minWidth: "610px" }}>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                        column
                        disabled={false}
                        width={150}
                        fieldName={'numberOfRefills'}
                        record={{}}
                        setRecord={""}
                    />

                    <MyInput
                        column
                        disabled={false}
                        fieldLabel="Min. Refill Interval"
                        width={150}
                        fieldName={'minimumRefillInterval'}
                        record={{}}
                        setRecord={""}
                    />
                    <MyInput
                        column
                        disabled={false}
                        rows={1}
                        fieldType="textarea"
                        width={150}
                        fieldName={'notes'}
                        record={{}}
                        setRecord={""}
                    />
                </Form>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                        column
                        disabled={true}
                        width={150}

                        fieldName={'controlCategory'}
                        record={{}}
                        setRecord={""}
                    />

                    <MyInput
                        column
                        disabled={false}
                        width={150}
                        fieldLabel="DEA Number"
                        fieldName={'deaNumber'}
                        record={{}}
                        setRecord={""}
                    />
                    <MyInput
                        column
                        disabled={true}
                        width={150}

                        fieldName={'Indication'}
                        record={{}}
                        setRecord={""}
                    />
                </Form>
                <Form style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                        column
                        disabled={false}
                        width={150}
                        fieldType="date"
                        fieldName={'validUtil'}
                        record={{}}
                        setRecord={""}
                    />
                    <MyInput
                        column
                        disabled={false}
                        width={150}

                        fieldName={'maximumDose'}
                        record={{}}
                        setRecord={""}
                    />

                </Form>
            </div>
        </div>
        <div className='top-container-p'>
            <div className='toggle-style'>
                <Text style={{ marginRight: "2px" }} >Chronic Medication</Text>
                <Toggle
                    //   onChange={e =>
                    //     setSelectedDiagnose({
                    //       ...selectedDiagnose,
                    //       isSuspected: e
                    //     })
                    //   } 
                    checkedChildren="Yes" unCheckedChildren="No"
                //   defaultChecked ={selectedDiagnose.isSuspected}
                //   disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}
                /></div>
            <div className='toggle-style'>
                <Text >Generic substitute allowed</Text>
                <Toggle
                    //   onChange={e =>
                    //     setSelectedDiagnose({
                    //       ...selectedDiagnose,
                    //       isSuspected: e
                    //     })
                    //   } 
                    checkedChildren="Yes" unCheckedChildren="No"
                //   defaultChecked ={selectedDiagnose.isSuspected}
                //   disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}
                /></div>
            <div>
                <Form style={{ zoom: 0.85 }} fluid>

                    <MyInput

                        width={250}
                        fieldType="select"
                        fieldLabel="Administration Instructions"
                        selectData={administrationInstructionsLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        fieldName={'administrationInstructions'}
                        record={{}}
                        setRecord={""}
                    />
                    <MyInput

                        disabled={false}
                        fieldType="textarea"
                        rows={3}
                        width={250}

                        fieldName={'Dose'}
                        record={{}}
                        setRecord={""}
                    />
                </Form>
            </div>
            <div style={{ marginLeft: "15px", padding: "10px" }}>
                <Text style={{ marginBottom: "10px" }}>Parameters to monitor</Text>
                <TagGroup className='taggroup-style'>
                    {tags.map((item, index) => (
                        <Tag key={index} closable onClose={() => removeTag(item)}>
                            {item}
                        </Tag>
                    ))}
                    {renderInput()}
                </TagGroup>
            </div>
        </div>

        <div className='mid-container-p '>
            <div >
                <IconButton
                    color="cyan"
                    appearance="primary"

                    icon={<PlusIcon />}
                >
                    <Translate>Add</Translate>
                </IconButton>
                <IconButton
                    color="cyan"
                    appearance="primary"
                    style={{ marginLeft: "5px" }}
                    icon={<BlockIcon />}

                >
                    <Translate> Cancle</Translate>
                </IconButton>


            </div>
              
            <div>
            <Table
                height={400}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                    if (sortBy)
                        setListRequest({
                            ...listRequest,
                            sortBy,
                            sortType
                        });
                }}
                headerHeight={80}
                rowHeight={60}
                bordered
                cellBordered

                data={[]}
                // onRowClick={rowData => {
                //     setOrder(rowData);
                // }}
                // rowClassName={isSelected}
            >
                <Column flexGrow={1}>
                    <HeaderCell align="center">

                        <Translate>#</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData => (
                            <Checkbox
                                key={rowData.id}
                                checked={selectedRows.includes(rowData)}
                                onChange={() => handleCheckboxChange(rowData)}
                                // disabled={rowData.statusLvalue?.lovDisplayVale !== 'New'}
                            />
                        )}
                    </Cell>


                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('orderType', e)} />
                        <Translate>Medication Name</Translate>
                    </HeaderCell>
                    <Cell dataKey="medicationName" />
                </Column>
                <Column flexGrow={4}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('instructions', e)} />
                        <Translate>Instructions</Translate>
                    </HeaderCell>
                    <Cell>
                        {rowData =>
                            rowData.instructions
                        }

                    </Cell>
                </Column>
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('validUntil', e)} />
                        <Translate>Valid until</Translate>
                    </HeaderCell>
                    <Cell dataKey="validUntil" />
                </Column>
         
                <Column flexGrow={2}>
                    <HeaderCell align="center">
                        <Input onChange={e => handleFilterChange('ststusLvalue', e)} />
                        <Translate>Status</Translate>
                    </HeaderCell>
                    <Cell >{rowData => rowData.statusLvalue?.lovDisplayVale || ''}
                    </Cell>
                </Column>
                      
              
                <Column flexGrow={2}>
                    <HeaderCell align="center">

                        <Translate>Add details</Translate>
                    </HeaderCell>
                    <Cell  ><IconButton 
                    // onClick={OpenDetailsModel} 
                    icon={<OthersIcon />} /></Cell>
                </Column>
            </Table>

            </div>
        </div>
    </>);
};
export default Prescription;