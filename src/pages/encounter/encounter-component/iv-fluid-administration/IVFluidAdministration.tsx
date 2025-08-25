import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSprayCanSparkles, faPlay, faBottleDroplet } from '@fortawesome/free-solid-svg-icons';
import AddEditFluidOrder from '../iv-fluid-order/AddEditFluidOrder';
import Additives from '../iv-fluid-order/additives';
import './style.less';
import { Tooltip, Whisper, RadioGroup, Radio, Row, Col, Form, Text } from 'rsuite';
import MyInput from '@/components/MyInput';
import VitalSigns from '@/pages/medical-component/vital-signs';
// import VitalSigns from './VitalSignsIv';
import { ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import Section from '@/components/Section';
import Toggle from './Toggle';
import AdministrationDetails from './AdministrationDetails';
import FluidAdministrationTable from './FluidAdministrationTable';

const IVFluidAdministration = () => {
  const [fluidOrder, setFluidOrder] = useState<any>({});
  const [openAddEditFluidOrderPopup, setOpenAddEditFluidOrderPopup] = useState<boolean>(false);
  const [openAdditivesPopup, setOpenAdditivesPopup] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [showCompleted, setShowCompleted] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [vital, setVital] = useState({
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    heartRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
    measurementSiteLkey: '',
    respiratoryRate: 0
  });
  const [patientObservationSummary, setPatientObservationSummary] =
    useState<ApPatientObservationSummary>({
      ...newApPatientObservationSummary,
      latesttemperature: null,
      latestbpSystolic: null,
      latestbpDiastolic: null,
      latestheartrate: null,
      latestrespiratoryrate: null,
      latestoxygensaturation: null,
      latestglucoselevel: null,
      latestweight: null,
      latestheight: null,
      latestheadcircumference: null,
      latestpainlevelLkey: null
    });
  const [readOnly, setReadOnly] = useState(false);

  const isSelected = rowData => (rowData?.key === fluidOrder?.key ? 'selected-row' : '');

  // Dummy data
  const data = [
    {
      key: '1',
      fluidType: 'Normal Saline 0.9%',
      volume: '1000',
      route: 'Peripheral IV',
      infusionRate: '125',
      frequency: 1,
      duration: 'Until Complete',
      untilComplete: true,
      device: 'IV Pump',
      indication: 'Dehydration treatment',
      status: 'Requested',
      notesToNurse: 'Monitor for fluid overload',
      priority: 'high',
      allergyChecked: 'yes',
      startTime: '08:30',
      estimatedEndTime: '16:30',
      createdBy: 'Dr. Sarah Johnson',
      createdAt: '08:00'
    },
    {
      key: '2',
      fluidType: "Lactated Ringer's",
      volume: '500',
      route: 'Central Line',
      infusionRate: '83',
      frequency: 1,
      duration: '6',
      untilComplete: false,
      device: 'IV Pump',
      indication: 'Post-operative fluid replacement',
      status: 'Started',
      notesToNurse: 'Check potassium levels',
      priority: 'medium',
      allergyChecked: 'yes',
      startTime: '14:00',
      estimatedEndTime: '20:00',
      createdBy: 'Dr. Michael Chen',
      createdAt: '13:45'
    },
    {
      key: '3',
      fluidType: 'D5W',
      volume: '250',
      route: 'Peripheral IV',
      infusionRate: '42',
      frequency: 1,
      duration: 'Until Complete',
      untilComplete: true,
      device: 'IV Pump',
      indication: 'Maintenance fluids',
      status: 'Completed',
      notesToNurse: 'Monitor blood glucose',
      priority: 'low',
      allergyChecked: 'yes',
      startTime: '22:00',
      estimatedEndTime: '06:00',
      createdBy: 'Dr. Emily Rodriguez',
      createdAt: '21:30'
    }
  ];

  const addLog = (action: string) => {
    setLogs(prev => [...prev, { action, time: new Date().toLocaleString(), doneBy: 'Nurse A' }]);
  };

  // Icons column (Actions)
  const iconsForActions = (rowData: any) => (
    <div className="container-of-icons">
      <Whisper placement="top" speaker={<Tooltip>Additives</Tooltip>}>
        <FontAwesomeIcon
          color="var(--primary-gray)"
          className="icons-style"
          icon={faSprayCanSparkles}
          onClick={() => setOpenAdditivesPopup(true)}
        />
      </Whisper>
      <Whisper placement="top" speaker={<Tooltip>Start Plan</Tooltip>}>
        <FontAwesomeIcon
          color="green"
          className="icons-style"
          icon={faPlay}
          onClick={() => {
            setFluidOrder({ ...rowData, status: 'Started', actualStart: new Date() });
            addLog(`Start: ${rowData.fluidType}`);
          }}
        />
      </Whisper>
      <Whisper placement="top" speaker={<Tooltip>Prepare Mixture</Tooltip>}>
        <FontAwesomeIcon color="blue" className="icons-style" icon={faBottleDroplet} />
      </Whisper>
    </div>
  );

  // Table columns
  const tableColumns = [
    { key: 'fluidType', title: <Translate>Fluid Type</Translate> },
    { key: 'volume', title: <Translate>Volume</Translate> },
    { key: 'route', title: <Translate>Route</Translate> },
    { key: 'infusionRate', title: <Translate>Infusion Rate</Translate> },
    { key: 'status', title: <Translate>Status</Translate> },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (rowData: any) => iconsForActions(rowData)
    }
  ];

  const handleNew = () => {
    setOpenAddEditFluidOrderPopup(true);
    setFluidOrder({ untilCompleted: true });
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <div className="container-of-buttons-iv">
        <Form fluid>
          <MyInput
            width="13vw"
            fieldName="showCompleted"
            fieldType="check"
            record={{ showCompleted }}
            setRecord={val => setShowCompleted(val.showCompleted)}
            fieldLabel="Show Completed"
            showLabel={false}
          />
        </Form>

        <MyButton
          color="var(--deep-blue)"
          prefixIcon={() => <PlusIcon />}
          onClick={handleNew}
          width="100px"
          disabled={fluidOrder?.status === 'Completed'}
        >
          Add New
        </MyButton>
      </div>

      <MyTable
        height={450}
        data={data.filter(o => showCompleted || o.status !== 'Completed')}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setFluidOrder(rowData)}
      />

      {/* Sections for any fluid order that is started */}
      {fluidOrder?.status === 'Started' && (
        <div className="mt-42">
          <div className="flex-gap-stretch">
            <div className="half-width min-height-394">
              <Section
                title={<p className="font-small">Vital Signs</p>}
                content={
                  <div className="main-content-section-1 margin-left">
                    <VitalSigns object={vital} setObject={setVital} disabled={true} width="28vw" />

                    <Row className="rows-gap margin-left">
                      <Col md={24}>
                        <Form fluid>
                          <MyInput
                            fieldLabel="Note"
                            height="100px"
                            width={430}
                            fieldName="latestnotes"
                            disabled={true || readOnly}
                            fieldType="textarea"
                            record={patientObservationSummary}
                            setRecord={setPatientObservationSummary}
                          />
                        </Form>
                      </Col>
                    </Row>
                  </div>
                }
              />
            </div>

            <div className="half-width">
              <Section
                title={<p className="font-small">Administration Details</p>}
                content={
                  <div className="main-content-section-1 margin-3">
                    <Form fluid className="administration-details form-flex-wrap">
                      <MyInput
                        width="100%"
                        fieldName="preparationTime"
                        fieldType="datetime"
                        record={fluidOrder}
                        setRecord={setFluidOrder}
                      />
                      <MyInput
                        width="100%"
                        fieldName="actualStartTime"
                        fieldType="datetime"
                        record={fluidOrder}
                        setRecord={setFluidOrder}
                      />
                      <Form.Group>
                        <Form.ControlLabel>Fluid Appearance</Form.ControlLabel>
                        <RadioGroup inline name="fluidAppearance">
                          <Radio value="Clear">Clear</Radio>
                          <Radio value="Cloudy">Cloudy</Radio>
                          <Radio value="Leaking">Leaking</Radio>
                        </RadioGroup>
                      </Form.Group>
                      <div className="full-width flexing">
                        <MyInput
                          fieldType="checkbox"
                          fieldName="rateConfirmed"
                          fieldLabel="Rate Confirmed"
                          width={100}
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                        />
                        <Toggle />
                      </div>
                      <div className="full-width">
                        <MyInput
                          fieldType="textarea"
                          fieldName="monitoringNotes"
                          placeholder="Monitoring Notes"
                          record={fluidOrder}
                          setRecord={setFluidOrder}
                          height={35}
                        />
                      </div>
                    </Form>
                  </div>
                }
              />
            </div>
          </div>
          <div className="margin-10">
            <Section
              title={
                <>
                  <p className="font-small">Fluid Administration</p>
                </>
              }
              content={
                <>
                  <AdministrationDetails
                    fluidOrder={fluidOrder}
                    setFluidOrder={setFluidOrder}
                    addLog={addLog}
                  />
                  <FluidAdministrationTable
                    fluidOrder={fluidOrder}
                    setFluidOrder={setFluidOrder}
                    addLog={addLog}
                  />
                </>
              }
            />
          </div>
        </div>
      )}

      <AddEditFluidOrder
        open={openAddEditFluidOrderPopup}
        setOpen={setOpenAddEditFluidOrderPopup}
        width={width}
        fluidOrder={fluidOrder}
        setFluidOrder={setFluidOrder}
      />
      <Additives open={openAdditivesPopup} setOpen={setOpenAdditivesPopup} />
    </div>
  );
};

export default IVFluidAdministration;
