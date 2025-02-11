import { useState, useEffect } from 'react';
import DynamicLineChart from '@/components/Charts/DynamicLineChart/DynamicLineChart';
import MyLabel from '@/components/MyLabel';
import Translate from '@/components/Translate';
import { Trash, Check, Icon } from '@rsuite/icons';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import { Reload } from '@rsuite/icons';
import ConversionIcon from '@rsuite/icons/Conversion';
import SortUpIcon from '@rsuite/icons/SortUp';
import { HStack } from 'rsuite';
import { AvatarGroup, Avatar } from 'rsuite';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import WarningIcon from '@rsuite/icons/legacy/Warning';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faHandDots,
  faTriangleExclamation
  , faClipboardList,
  faComment
  ,
  faPrint
  ,
  faComments,
  faVialCircleCheck,
  faDiagramPredecessor,
  faFilter,
  faStar,
  
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import './styles.less';
import { Badge } from 'rsuite';
import { FaWeight, FaRulerVertical, FaUserCircle, FaDumbbell, FaUserAlt, FaTint, FaMars } from 'react-icons/fa';
import {
  InputGroup,
  ButtonToolbar,
  Form,
  IconButton,
  Input,
  Divider,
  Drawer,
  Table,
  Pagination,
  Row,
  Progress,
  DatePicker,
  Dropdown,

} from 'rsuite';
import { Popover, Whisper } from 'rsuite';
import ArrowDownIcon from '@rsuite/icons/ArrowDown';
import MyInput from '@/components/MyInput';
import SearchIcon from '@rsuite/icons/Search';
import { Panel, FlexboxGrid, Col, List, Stack, Button, Timeline 
  , Steps
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
const Lab = () => {
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [openorders, setOpenOrders] = useState(false);
  const [openresults, setOpenResults] = useState(false);
  const [showFilterInput, setShowFilterInput] = useState(false);
  const searchCriteriaOptions = [
    { label: 'MRN', value: 'patientMrn' },
    { label: 'Document Number', value: 'documentNo' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Archiving Number', value: 'archivingNumber' },
    { label: 'Primary Phone Number', value: 'mobileNumber' },
    { label: 'Date of Birth', value: 'dob' }
  ];
  return (<div>

    <Row>
      <Col xs={20} >

        <Row>
          <h5 style={{ marginLeft: '5px' }}> Clinical Laboratory</h5>
        </Row>
        <Row>
          <Col xs={14}>
            <Panel style={{ border: '1px solid #e5e5ea', borderRadius: '25px', zoom: 0.93 }}>
              <Table
                height={200}
                width={700}
                //   sortColumn={listRequest.sortBy}
                //   sortType={listRequest.sortType}
                //   onSortColumn={(sortBy, sortType) => {
                //     if (sortBy)
                //       setListRequest({
                //         ...listRequest,
                //         sortBy,
                //         sortType
                //       });
                //   }}
                headerHeight={35}
                rowHeight={40}

                data={[{ name: "hanan", hasObservation: true, patientAge: "34" }
                  ,
                { name: "hanan", hasObservation: true, patientAge: "34" }
                  ,
                { name: "hanan", hasObservation: true, patientAge: "34" }
                ]}
                onRowClick={rowData => {
                  setOpenOrders(true);
                }}
              //   rowClassName={isSelected}
              >
                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    {showFilterInput ? (

                      <Input
                        placeholder="Search ORDER ID"
                        // value={filterValue}
                        // onChange={value => setFilterValue(value)}
                        // onKeyPress={handleKeyPress}
                        onBlur={() => setShowFilterInput(false)}
                        style={{ width: '80%', height: '23px', marginBottom: '3px' }}
                      />
                    ) : (

                      <div onClick={() => setShowFilterInput(true)} style={{ cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                        <Translate> ORDER ID</Translate>
                      </div>
                    )}
                  </HeaderCell>
                  <Cell dataKey="queueNumber" />
                </Column>
                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} />
                    <Translate>  DATE,TIME</Translate>
                  </HeaderCell>
                  <Cell dataKey="visitId" />
                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                    <Translate>MRN</Translate>
                  </HeaderCell>
                  <Cell>
                    YES
                  </Cell>
                </Column>
                <Column sortable flexGrow={1} fullText>
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                    <Translate>PATIENT NAME</Translate>
                  </HeaderCell>
                  <Cell dataKey="patientAge" />
                </Column>



                <Column sortable flexGrow={2} fullText >
                  <HeaderCell>
                    <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                    <Translate>SATUTS</Translate>
                  </HeaderCell>
                  <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rowData => (rowData.hasObservation ? <Badge content="YES" style={{
                      backgroundColor: '#bcf4f7',
                      color: '#008aa6',
                      padding: '5px 19px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: "bold"
                    }} /> : <Badge
                      style={{
                        backgroundColor: 'rgba(238, 130, 238, 0.2)',
                        color: '#4B0082',
                        padding: '5px 19px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: "bold"
                      }}
                      content="NO"
                    />)}
                  </Cell>
                </Column>

                <Column sortable flexGrow={2} fullText>
                  <HeaderCell>

                    <Translate>MARKER</Translate>
                  </HeaderCell>
                  <Cell>
                    l</Cell>
                </Column>
              </Table>
              <Divider style={{ margin: '4px 4px' }} />
              <Pagination
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                limitOptions={[5, 15, 30]}
                //  limit={listRequest.pageSize}
                //  activePage={listRequest.pageNumber}

                //  onChangePage={pageNumber => {
                //    setListRequest({ ...listRequest, pageNumber });
                //  }}
                //  onChangeLimit={pageSize => {
                //    setListRequest({ ...listRequest, pageSize });
                //  }}
                total={40}
              />
            </Panel>
          </Col>
          <Col xs={10}>
            <Row>
              <DatePicker

                oneTap
                placeholder="From Date"
                // value={dateFilter.fromDate}
                // onChange={e => setDateFilter({ ...dateFilter, fromDate: e })}
                style={{ width: '230px', marginRight: '5px' }}
              />
              <DatePicker
                oneTap
                placeholder="To Date"
                // value={dateFilter.toDate}
                // onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
                style={{ width: '230px', marginRight: '5px' }}
              />
              <IconButton appearance="primary"
                style={{ backgroundColor: "#00b1cc", borderColor: "#00b1cc", color: "white" }}
                icon={<SearchIcon />} >

              </IconButton></Row>
            <Row> <InputGroup style={{ marginBottom: '10px' }}>
              <Dropdown
                title={selectedCriterion}
                placement="bottomStart"
                renderToggle={(props, ref) => (
                  <InputGroup.Addon style={{ background: 'none' }} {...props} ref={ref}>
                    <ArrowDownIcon />
                  </InputGroup.Addon>
                )}
              >
                {searchCriteriaOptions.map(option => (
                  <Dropdown.Item key={option.value} onSelect={() => setSelectedCriterion(option.label)}>
                    {option.label}
                  </Dropdown.Item>
                ))}
              </Dropdown>

              <Input placeholder={`Search by ${selectedCriterion}`} />
              <InputGroup.Addon>
                <SearchIcon />
              </InputGroup.Addon>
            </InputGroup>
            </Row>
            <Row>
            <Steps current={1} style={{zoom:0.70}}>
    <Steps.Item title="Sample Collected" description="10:30 AM." />
    <Steps.Item title="Accepted" description="5:00 PM" />
    <Steps.Item title="Result Ready" description="10:30 AM." />
    <Steps.Item title="Result Approved" description="5:00 PM" />
  </Steps>
            </Row>
          </Col>
        </Row>
        <Row>
          {openorders && <Panel header="Order's Tests" collapsible defaultExpanded style={{ border: '1px solid #e5e5ea', borderRadius: '25px', zoom: 0.93 }}>
            <Table

              height={200}
              //   sortColumn={listRequest.sortBy}
              //   sortType={listRequest.sortType}
              //   onSortColumn={(sortBy, sortType) => {
              //     if (sortBy)
              //       setListRequest({
              //         ...listRequest,
              //         sortBy,
              //         sortType
              //       });
              //   }}
              headerHeight={35}
              rowHeight={40}

              data={[{ name: "hanan", hasObservation: true, patientAge: "34" }
                ,
              { name: "hanan", hasObservation: true, patientAge: "34" }
                ,
              { name: "hanan", hasObservation: true, patientAge: "34" }
              ]}
              onRowClick={rowData => {
                setOpenResults(true);
              }}
            //   rowClassName={isSelected}
            >
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>TEST CATEGORY</Translate>
                </HeaderCell>
                <Cell dataKey="queueNumber" />
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>TEST NAME</Translate>
                </HeaderCell>
                <Cell dataKey="visitId" />
              </Column>

              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>IS PROFILE</Translate>
                </HeaderCell>
                <Cell>
                  YES
                </Cell>
              </Column>
              <Column sortable flexGrow={1} fullText>
                <HeaderCell>

                  <Translate>REASON</Translate>
                </HeaderCell>
                <Cell dataKey="patientAge" />
              </Column>


              <Column sortable flexGrow={3} fullText>
                <HeaderCell>

                  <Translate>DURATION</Translate>
                </HeaderCell>
                <Cell>
                  l</Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>PHYSICIAN</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>

              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>PHYSICIAN</Translate>
                </HeaderCell>
                <Cell>
                  ll
                </Cell>
              </Column>

              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>ATTACHMENT</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>ORDERS NOTES</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              {/* <Column sortable flexGrow={1} fullText>
                <HeaderCell>

                  <Translate>VIEW TEST CARD</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>
                      
                      <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: '1em'}}/>

                    </HStack>
                 
                  )}
                </Cell>

              </Column> */}
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>Technician Notes</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faComment} style={{ fontSize: '1em' }} />

                    </HStack>

                  )}
                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>COLLECT SAMPLE</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faVialCircleCheck} style={{ fontSize: '1em' }} />

                    </HStack>

                  )}
                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText >
                <HeaderCell>
                  <Translate>SATUTS</Translate>
                </HeaderCell>
                <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {rowData => (rowData.hasObservation ? <Badge content="YES" style={{
                    backgroundColor: '#bcf4f7',
                    color: '#008aa6',
                    padding: '5px 19px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: "bold"
                  }} /> : <Badge
                    style={{
                      backgroundColor: 'rgba(238, 130, 238, 0.2)',
                      color: '#4B0082',
                      padding: '5px 19px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: "bold"
                    }}
                    content="NO"
                  />)}
                </Cell>
              </Column>
              <Column sortable flexGrow={4} fullText>
                <HeaderCell>

                  <Translate>ACTION</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>
                      <WarningRoundIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      <CheckRoundIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      <ConversionIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      <SortUpIcon style={{ fontSize: '1em', marginRight: 10 }} />

                    </HStack>
                    // <div style={{ display: 'flex', gap: '5px' }}>

                    //   <IconButton 
                    //     icon={<WarningRoundIcon  />} 

                    //     appearance="subtle" 
                    //   //   onClick={() => handleDelete(rowData)}
                    //   />


                    //   <IconButton 
                    //     icon={<CheckRoundIcon />} 

                    //     appearance="subtle" 
                    //   //   onClick={() => handleCheck(rowData)}
                    //   />


                    //   <IconButton 
                    //     icon={<ConversionIcon />} 

                    //     appearance="subtle" 
                    //   //   onClick={() => handleRollback(rowData)}
                    //   />
                    // </div>
                  )}
                </Cell>

              </Column>
            </Table>
            <Divider style={{ margin: '4px 4px' }} />
            <Pagination
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={5}
              size="xs"
              layout={['total', '-', 'limit', '|', 'pager', 'skip']}
              limitOptions={[5, 15, 30]}
              //  limit={listRequest.pageSize}
              //  activePage={listRequest.pageNumber}

              //  onChangePage={pageNumber => {
              //    setListRequest({ ...listRequest, pageNumber });
              //  }}
              //  onChangeLimit={pageSize => {
              //    setListRequest({ ...listRequest, pageSize });
              //  }}
              total={40}
            />
          </Panel>}
        </Row>
        <Row>
          {openresults && <Panel header="Test's Results Processing" collapsible defaultExpanded style={{ border: '1px solid #e5e5ea', borderRadius: '25px', zoom: 0.93 }}>
            <Table

              height={200}
              //   sortColumn={listRequest.sortBy}
              //   sortType={listRequest.sortType}
              //   onSortColumn={(sortBy, sortType) => {
              //     if (sortBy)
              //       setListRequest({
              //         ...listRequest,
              //         sortBy,
              //         sortType
              //       });
              //   }}
              headerHeight={35}
              rowHeight={40}

              data={[{ name: "hanan", hasObservation: true, patientAge: "34" }
                ,
              { name: "hanan", hasObservation: true, patientAge: "34" }
                ,
              { name: "hanan", hasObservation: true, patientAge: "34" }
              ]}
            //   onRowClick={rowData => {
            //     setLocalEncounter(rowData);
            //     setLocalPatient(rowData.patientObject)
            //   }}
            //   rowClassName={isSelected}
            >
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>TEST RESULT,UNIT</Translate>
                </HeaderCell>
                <Cell dataKey="queueNumber" />
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>NORMAL RANGE</Translate>
                </HeaderCell>
                <Cell dataKey="visitId" />
              </Column>

              <Column sortable flexGrow={2} fullText>
                <HeaderCell>
                  <Translate>MARKER</Translate>
                </HeaderCell>
                <Cell>
                  YES
                </Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>COMMENTS</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faComments} style={{ fontSize: '1em' }} />

                    </HStack>

                  )}
                </Cell>
              </Column>


              <Column sortable flexGrow={3} fullText>
                <HeaderCell>

                  <Translate>PREVIOUS RESULT</Translate>
                </HeaderCell>
                <Cell>
                  l</Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>PREVIOUS RESULT DATE</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>COMPARE WITH ALL PREVIOUS</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>

                      <FontAwesomeIcon icon={faDiagramPredecessor} style={{ fontSize: '1em' }} />

                    </HStack>

                  )}
                </Cell>
              </Column>


              <Column sortable flexGrow={1} fullText>
                <HeaderCell>

                  <Translate>EXTERNEL STATUS</Translate>
                </HeaderCell>
                <Cell >
                  K
                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText >
                <HeaderCell>
                  <Translate> RESULT SATUTS</Translate>
                </HeaderCell>
                <Cell style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {rowData => (rowData.hasObservation ? <Badge content="YES" style={{
                    backgroundColor: '#bcf4f7',
                    color: '#008aa6',
                    padding: '5px 19px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: "bold"
                  }} /> : <Badge
                    style={{
                      backgroundColor: 'rgba(238, 130, 238, 0.2)',
                      color: '#4B0082',
                      padding: '5px 19px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: "bold"
                    }}
                    content="NO"
                  />)}
                </Cell>
              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>EXTERNEL LAB NAME</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>ATTACHMENT</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={2} fullText>
                <HeaderCell>

                  <Translate>ATTACHED BY/DATE</Translate>
                </HeaderCell>
                <Cell>
                  ll

                </Cell>

              </Column>
              <Column sortable flexGrow={4} fullText>
                <HeaderCell>

                  <Translate>ACTION</Translate>
                </HeaderCell>
                <Cell >
                  {rowData => (
                    <HStack spacing={10}>
                      <WarningRoundIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      <CheckRoundIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      <ConversionIcon style={{ fontSize: '1em', marginRight: 10 }} />
                      \
                      <FontAwesomeIcon icon={faPrint} style={{ fontSize: '1em', marginRight: 10 }} />
                      <FontAwesomeIcon icon={faStar} style={{ fontSize: '1em', marginRight: 10 }} />
                    </HStack>
                    // <div style={{ display: 'flex', gap: '5px' }}>

                    //   <IconButton 
                    //     icon={<WarningRoundIcon  />} 

                    //     appearance="subtle" 
                    //   //   onClick={() => handleDelete(rowData)}
                    //   />


                    //   <IconButton 
                    //     icon={<CheckRoundIcon />} 

                    //     appearance="subtle" 
                    //   //   onClick={() => handleCheck(rowData)}
                    //   />


                    //   <IconButton 
                    //     icon={<ConversionIcon />} 

                    //     appearance="subtle" 
                    //   //   onClick={() => handleRollback(rowData)}
                    //   />
                    // </div>
                  )}
                </Cell>

              </Column>
            </Table>
            <Divider style={{ margin: '4px 4px' }} />
            <Pagination
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={5}
              size="xs"
              layout={['total', '-', 'limit', '|', 'pager', 'skip']}
              limitOptions={[5, 15, 30]}
              //  limit={listRequest.pageSize}
              //  activePage={listRequest.pageNumber}

              //  onChangePage={pageNumber => {
              //    setListRequest({ ...listRequest, pageNumber });
              //  }}
              //  onChangeLimit={pageSize => {
              //    setListRequest({ ...listRequest, pageSize });
              //  }}
              total={40}
            />
          </Panel>
          }
        </Row>

      </Col>

      <Col style={{ border: '1px solid #e5e5ea', height: '87vh' }} xs={4}>


        <Row style={{ alignItems: 'center', marginTop: '4px' }}>
          <Col xs={6}>
            <Avatar src="https://i.pravatar.cc/150?u=2" circle size="lg" />
          </Col>
          <Col style={{ flexGrow: 1, marginLeft: 10, marginTop: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              Ahmad

              <FaMars style={{ marginLeft: 8, color: '#007bff' }} />

            </div>
            <div style={{ fontSize: '12px', color: '#666' }}> 1001-22 y</div>
          </Col>
        </Row>

        <Row style={{ paddingLeft: '14px' }}>
          <span style={{ fontWeight: "bold" }}>Document Type</span>:No document
        </Row>
        <Row style={{ paddingLeft: '14px' }}>
          <span style={{ fontWeight: "bold" }}> Document No</span>:35546578
        </Row>

        {/* <Row style={{ paddingLeft: '14px' }}>
          <span style={{ fontWeight: "bold" }}> Age</span>:22
        </Row> */}

        <Row style={{ paddingLeft: '14px' }}>
          <Col xs={10}>
            <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <FaWeight size={15} color="#3498db" /> <br />
              <strong>Weight:</strong> 60 kg
            </Panel>
          </Col>
          <Col xs={10}>
            <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <FaRulerVertical size={15} color="#27ae60" /> <br />
              <strong>Height:</strong> 160 cm
            </Panel>
          </Col>
        </Row>
        <Row style={{ paddingLeft: '14px' }}>
          <Col xs={10}>
            <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <FaUserCircle size={15} color="#27ae60" /> <br />
              <strong>H.C:</strong> 22 cm
            </Panel>
          </Col>
          <Col xs={10}>
            <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <FaDumbbell size={15} color="#3498db" /> <br />
              <strong>BMI:</strong> 22.5
            </Panel>
          </Col>

        </Row>
        <Row style={{ paddingLeft: '14px' }}>
          <Col xs={10}>
            <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <FaUserAlt size={15} color="#27ae60" /> <br />
              <strong>BSA:</strong> 1.6
            </Panel>
          </Col>
          <Col xs={10}>
            <Panel bordered shaded style={{ padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <FaTint size={15} color="red" /> <br />
              <strong>Blood:</strong> A
            </Panel>
          </Col>

        </Row>
        <Row style={{ paddingLeft: '14px' }}>
          <span style={{ fontWeight: "bold" }}> Diagnosis</span>:L022333,hh
        </Row>
        <Row style={{ paddingLeft: '14px' }}>
          <Col xs={10}>
            <Button appearance="primary"
              // onClick={OpenWarningModal}
              style={{ backgroundColor: "#00b1cc", borderColor: "#00b1cc", color: "white" }}

            >
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <Translate>Warning</Translate>
            </Button>
          </Col>
          <Col xs={10}>
            <Button appearance="primary"
              // onClick={OpenAllargyModal}
              // color={patientSlice.patient.hasAllergy ? "red" : "cyan"} 
              style={{ backgroundColor: "#00b1cc", borderColor: "#00b1cc", color: "white" }}
            >
              <FontAwesomeIcon icon={faHandDots} />
              <Translate>Allergy</Translate>
            </Button>
          </Col>
        </Row>

      </Col>
    </Row>

  </div>)
}
export default Lab;