import { useState, useEffect, useRef } from 'react';
import Translate from '@/components/Translate';
import {
    faHandDots,
    faTriangleExclamation
    ,
    faIdCard,
    faUser,
    faFileWaveform
} from '@fortawesome/free-solid-svg-icons';
import { useGetAllergensQuery } from '@/services/setupService';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { useGetEncountersQuery } from '@/services/encounterService';
import {
    useGetAllergiesQuery,
    useSaveAllergiesMutation,
    useGetWarningsQuery
} from '@/services/observationService';
import React from 'react';
import {
    Button,
    Panel,
    Row,
    Avatar,
    Text,
    Col,
    Divider,
    Modal,
    Stack,
Table,
Checkbox,
IconButton
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
    useUploadMutation,
    useFetchAttachmentQuery,
} from '@/services/attachmentService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaWeight, FaRulerVertical, FaUserCircle, FaDumbbell, FaUserAlt, FaTint, FaMars, FaVenus, FaUserNinja, FaCalendar } from 'react-icons/fa';
import { calculateAgeFormat } from '@/utils';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import { initialListRequest, ListRequest } from '@/types/types';
import { newApEncounter } from '@/types/model-types-constructor';
import { ApAttachment } from '@/types/model-types';
import './styles.less'
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
const PatientSide = ({ patient, encounter }) => {
   
    const [openAllargyModal, setOpenAllargyModal] = useState(false);
    const [openWarningModal, setOpenWarningModal] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const profileImageFileInputRef = useRef(null);
    const [upload, uploadMutation] = useUploadMutation();
    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
    const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);
    const [showCanceled, setShowCanceled] = useState(true);
      const { data: allergensListToGetName } = useGetAllergensQuery({
         ...initialListRequest
       });
    const filters = [
        {
            fieldName: 'patient_key',
            operator: 'match',
            value: patient?.key || undefined
        },
        {
            fieldName: "status_lkey",
            operator: showCanceled ? "notMatch" : "match",
            value: "3196709905099521",
        }
    ];


    const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({ ...initialListRequest, filters });
    const { data: warningsListResponse, refetch: fetchwarning } = useGetWarningsQuery({ ...initialListRequest, filters });
    const { data: patirntObservationlist } = useGetObservationSummariesQuery({
        ...initialListRequest,
        sortBy: 'createdAt',
        sortType: 'desc',
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key ?? undefined,
            }

        ],

    });
    const [bodyMeasurements, setBodyMeasurements] = useState({
        height: null,
        weight: null,
        headcircumference: null
    });
    const fetchPatientImageResponse = useFetchAttachmentQuery(
        {
            type: 'PATIENT_PROFILE_PICTURE',
            refKey: patient?.key,
        },
        { skip: !patient?.key }
    );

    useEffect(() => {
        setBodyMeasurements({
            height: patirntObservationlist?.object?.find((item) => item.latestheight != null)?.latestheight,
            weight: patirntObservationlist?.object?.find((item) => item.latestweight != null)?.latestweight,
            headcircumference: patirntObservationlist?.object?.find((item) => item.latestheadcircumference != null)?.latestheadcircumference
        })
    }, [patirntObservationlist]);

    useEffect(() => {
        if (
            fetchPatientImageResponse.isSuccess &&
            fetchPatientImageResponse.data &&
            fetchPatientImageResponse.data.key
        ) {
            setPatientImage(fetchPatientImageResponse.data);
        } else {
            setPatientImage(undefined);
        }
    }, [fetchPatientImageResponse]);
    const handleImageClick = type => {
        // setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE
        if (patient.key) profileImageFileInputRef.current.click();
    };
    const CloseAllargyModal = () => {
        setOpenAllargyModal(false);
      }
      const OpenAllargyModal = () => {
        setOpenAllargyModal(true);
      }
      const CloseWarningModal = () => {
        setOpenWarningModal(false);
      }
      const OpenWarningModal = () => {
        setOpenWarningModal(true);
      }
      const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];
    
        expandedRowKeys.forEach(key => {
          if (key === rowData.key) {
            open = true;
          } else {
            nextExpandedRowKeys.push(key);
          }
        });
    
        if (!open) {
          nextExpandedRowKeys.push(rowData.key);
        }
        setExpandedRowKeys(nextExpandedRowKeys);
      };
    const renderRowExpanded = rowData => {
    
    
        return (
    
    
          <Table
            data={[rowData]} // Pass the data as an array to populate the table
            style={{ width: '100%', marginTop: '5px', marginBottom: '5px' }}
            height={100} // Adjust height as needed
          >
            <Column flexGrow={2}   fullText>
              <HeaderCell>Created At</HeaderCell>
              <Cell dataKey="onsetDate" >
                {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
              </Cell>
            </Column>
            <Column flexGrow={1}   fullText>
              <HeaderCell>Created By</HeaderCell>
              <Cell dataKey="createdBy" />
            </Column>
            <Column flexGrow={2}   fullText>
              <HeaderCell>Resolved At</HeaderCell>
              <Cell dataKey="resolvedAt" >
                {rowData => {
                  if (rowData.statusLkey != '9766169155908512') {
    
                    return rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : "";
                  }
                }}
              </Cell>
            </Column>
            <Column flexGrow={1}   fullText>
              <HeaderCell>Resolved By</HeaderCell>
              <Cell dataKey="resolvedBy" />
            </Column>
            <Column flexGrow={2}   fullText>
              <HeaderCell>Cancelled At</HeaderCell>
              <Cell dataKey="deletedAt" >
                {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ""}
              </Cell>
            </Column>
            <Column flexGrow={1}   fullText>
              <HeaderCell>Cancelled By</HeaderCell>
              <Cell dataKey="deletedBy" />
            </Column>
            <Column flexGrow={1}   fullText>
              <HeaderCell>Cancelliton Reason</HeaderCell>
              <Cell dataKey="cancellationReason" />
            </Column>
          </Table>
    
    
        );
      };
      const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
          <IconButton
            appearance="subtle"
            onClick={() => {
              onChange(rowData);
            }}
            icon={
              expandedRowKeys.some(key => key === rowData["key"]) ? (
                <CollaspedOutlineIcon />
              ) : (
                <ExpandOutlineIcon />
              )
            }
          />
        </Cell>
      );
    return (
        <Panel className="patient-panel">
            <div className='div-avatar' >
                <Avatar

                    circle
                    bordered
                    onClick={() => handleImageClick('PATIENT_PROFILE_PICTURE')}
                    src={
                        patientImage && patientImage.fileContent
                            ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
                            : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                    }
                    alt={patient?.fullName}
                />
                <div>
                    <div className="patient-info">
                        <Text style={{ fontSize: '12px', fontFamily: 'Manrope Medium' }}>{patient?.fullName ?? "Patient Name"}</Text>


                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'Manrope Medium' }}>
                        #  {patient?.patientMrn ?? "MRN"}

                    </div>
                </div>

            </div>

            <Text style={{ marginTop: '5px' }}>
                <FontAwesomeIcon icon={faIdCard} style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Document  Information</span>
            </Text>
            <br />

            <div className='info-section'>
                <div className='info-column'>
                    <Text className='info-label'>Document No</Text>
                    <Text className='info-value'>
                        {patient?.documentTypeLvalue?.lovDisplayVale}
                    </Text>

                </div>

                <div className='info-column'
                >
                    <Text className='info-label'>Document Type</Text>
                    <Text className='info-value'
                    > {patient?.documentNo}</Text>

                </div>
            </div>
            <Divider style={{ margin: '4px 4px' }} />

            <Text >
                <FontAwesomeIcon icon={faUser} style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Patient  Information</span>
            </Text>
            <br />

            <div className='info-section'>
                <div className='info-column'>
                    <Text className='info-label'>Age</Text>
                    <Text className='info-value'>
                        {patient?.dob ? calculateAgeFormat(patient?.dob) : ""}
                    </Text>

                </div>

                <div className='info-column'
                >
                    <Text className='info-label'>Sex at Birth</Text>
                    <Text className='info-value'
                    > {patient?.genderLvalue?.lovDisplayVale}</Text>

                </div>


            </div>
            <Divider style={{ margin: '4px 4px' }} />
            <Text >
                <FaWeight style={{ color: 'var(--icon-gray)' }} /> <span style={{ fontWeight: 'bold' }}>Physical Measurements</span>
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <br />
                <div className='info-section'>
                    <div className='info-column'>
                        <Text className='info-label'>Weight</Text>
                        <Text className='info-value'>
                            {bodyMeasurements?.weight}
                        </Text>

                    </div>

                    <div className='info-column'
                    >
                        <Text className='info-label'>Height</Text>
                        <Text className='info-value'
                        > {bodyMeasurements?.height}</Text>

                    </div>
                </div>
                <div className='info-section'>
                    <div className='info-column'>
                        <Text className='info-label'>H.C</Text>
                        <Text className='info-value'>
                            {bodyMeasurements?.headcircumference}
                        </Text>

                    </div>

                    <div className='info-column'
                    >
                        <Text className='info-label'>BMI</Text>
                        <Text className='info-value'
                        > {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2)}</Text>

                    </div>
                </div>
                <div className='info-section'>
                    <div className='info-column'>
                        <Text className='info-label'>BSA</Text>
                        <Text className='info-value'>
                            {Math.sqrt((bodyMeasurements?.weight * bodyMeasurements?.height) / 3600).toFixed(2)}
                        </Text>

                    </div>

                    <div className='info-column'
                    >
                        <Text className='info-label'>Blood Group</Text>
                        <Text className='info-value'
                        > B+</Text>

                    </div>
                </div>
            </div>

            <Divider style={{ margin: '4px 4px' }} />
            <div className='info-section'>
                <MyButton
                    
                       onClick={OpenAllargyModal}
                    prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
                    color={patient?.hasAllergy ? "var(--primary-orange)" : "var(--deep-blue)"}
                >Allergy</MyButton>
                <MyButton
                 
                    color={patient?.hasWarning ? "var(--primary-orange)" : "var(--deep-blue)"}
                    onClick={OpenWarningModal}
                    prefixIcon={() => <FontAwesomeIcon icon={faTriangleExclamation} />}
                  >Warning</MyButton>
            </div>

            {/* <Row >
                <span style={{ fontWeight: 'bold' }}> Diagnosis:</span> {encounter?.diagnosis}

            </Row> */}
                    <MyModal 
                    position='right'
                     open={openAllargyModal}
                     setOpen={setOpenAllargyModal} 
                     title='Patient Allergy'
                     content={<>  <div>
                      <Checkbox
                        checked={!showCanceled}
                        onChange={() => {
    
    
                          setShowCanceled(!showCanceled);
                        }}
                      >
                        Show Cancelled
                      </Checkbox>
    
    
                    </div>
                    <Table
                      height={600}
                      data={warningsListResponse?.object || []}
                      rowKey="key"
                      expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                      renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                      shouldUpdateScroll={false}
                    
    
                    >
                      <Column width={70}  >
                        <HeaderCell>#</HeaderCell>
                        <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                      </Column>
    
                      <Column flexGrow={2} fullText>
                        <HeaderCell  >
                          <Translate>Warning Type</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData =>
                            rowData.warningTypeLvalue?.lovDisplayVale
                          }
                        </Cell>
                      </Column >
    
                      <Column flexGrow={2} fullText>
                        <HeaderCell  >
                          <Translate>Severity</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData =>
                            rowData.severityLvalue?.lovDisplayVale
                          }
                        </Cell>
                      </Column>
    
                      <Column flexGrow={2} fullText>
                        <HeaderCell  >
                          <Translate>First Time Recorded</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData => rowData.firstTimeRecorded ? new Date(rowData.firstTimeRecorded).toLocaleString() : "Undefind"}
                        </Cell>
                      </Column>
    
                      <Column flexGrow={2} fullText>
                        <HeaderCell  >
                          <Translate>Source of information</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData =>
                            rowData.sourceOfInformationLvalue?.lovDisplayVale || "BY Patient"
                          }
                        </Cell>
                      </Column>
    
                      <Column flexGrow={2} fullText>
                        <HeaderCell  >
                          <Translate>Notes</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData =>
                            rowData.notes
                          }
                        </Cell>
                      </Column>
                      <Column flexGrow={1} fullText>
                        <HeaderCell  >
                          <Translate>Status</Translate>
                        </HeaderCell>
                        <Cell>
                          {rowData =>
                            rowData.statusLvalue?.lovDisplayVale
                          }
                        </Cell>
                      </Column>
                    </Table>
    </>}
                     >
       
           
            </MyModal>
            <Modal size="lg" open={openWarningModal} onClose={CloseWarningModal} overflow  >
              <Modal.Title>
                <Translate><h6>Patient Warning</h6></Translate>
              </Modal.Title>
              <Modal.Body>
                <div>
                  <Checkbox
                    checked={!showCanceled}
                    onChange={() => {


                      setShowCanceled(!showCanceled);
                    }}
                  >
                    Show Cancelled
                  </Checkbox>


                </div>
                <Table
                  height={600}
                  data={warningsListResponse?.object || []}
                  rowKey="key"
                  expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                  renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                  shouldUpdateScroll={false}
                  bordered
                  cellBordered

                >
                  <Column width={70}>
                    <HeaderCell>#</HeaderCell>
                    <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                  </Column>

                  <Column flexGrow={2} fullText>
                    <HeaderCell>
                      <Translate>Warning Type</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData =>
                        rowData.warningTypeLvalue?.lovDisplayVale
                      }
                    </Cell>
                  </Column >

                  <Column flexGrow={2} fullText>
                    <HeaderCell >
                      <Translate>Severity</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData =>
                        rowData.severityLvalue?.lovDisplayVale
                      }
                    </Cell>
                  </Column>

                  <Column flexGrow={2} fullText>
                    <HeaderCell  >
                      <Translate>First Time Recorded</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData => rowData.firstTimeRecorded ? new Date(rowData.firstTimeRecorded).toLocaleString() : "Undefind"}
                    </Cell>
                  </Column>

                  <Column flexGrow={2} fullText>
                    <HeaderCell  >
                      <Translate>Source of information</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData =>
                        rowData.sourceOfInformationLvalue?.lovDisplayVale || "BY Patient"
                      }
                    </Cell>
                  </Column>

                  <Column flexGrow={2} fullText>
                    <HeaderCell  >
                      <Translate>Notes</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData =>
                        rowData.notes
                      }
                    </Cell>
                  </Column>
                  <Column flexGrow={1} fullText>
                    <HeaderCell  >
                      <Translate>Status</Translate>
                    </HeaderCell>
                    <Cell>
                      {rowData =>
                        rowData.statusLvalue?.lovDisplayVale
                      }
                    </Cell>
                  </Column>
                </Table>

              </Modal.Body>
              <Modal.Footer>
                <Stack spacing={2} divider={<Divider vertical />}>

                  <Button appearance="ghost" color="cyan" onClick={CloseWarningModal}>
                    Close
                  </Button>
                </Stack>
              </Modal.Footer>
            </Modal>
        </Panel>
    )
}
export default PatientSide;