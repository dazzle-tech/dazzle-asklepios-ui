import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBowlFood, faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { Radio, RadioGroup, Text } from 'rsuite';

import './style.less';

const initialForm = {
  dietOrderType: '',
  startDateTime: '',
  duration: '',
  durationUnit: '',
  foodPreferences: '',
  foodAvoidances: '',
  allergyAvoidances: '',
  // Conditional fields below
  mealType: '',
  portionSize: '',
  dietCategory: '',
  calorieTarget: '',
  proteinTarget: '',
  textureLevel: '',
  fluidConsistency: '',
  reason: '',
  dailyVolumeLimit: '',
  formulaName: '',
  deliveryMethod: '',
  rate: '',
  volumePerFeed: '',
  feedsPerDay: '',
  additionalInstructions: '',
  formulaComposition: '',
  infusionRate: '',
  infusionDuration: '',
  lineType: ''
};

const sampleRequests = [
  {
    id: 1,
    dietOrderType: 'regular',
    startDateTime: '2025-08-11 08:00',
    startDate: '2025-08-11',
    startTime: '8:00',
    duration: '3',
    durationUnit: 'days',
    orderedBy: 'Dr. Smith',
    status: 'Active',
    mealType: 'all',
    portionSize: 'medium',
    foodPreferences: 'Low sodium, high fiber',
    foodAvoidances: 'Nuts, shellfish',
    allergyAvoidances: 'Peanuts, dairy'
  },
  {
    id: 2,
    dietOrderType: 'texture',
    startDateTime: '2025-08-10 14:30',
    startDate: '2025-08-10',
    startTime: '14:30',
    duration: '7',
    durationUnit: 'days',
    orderedBy: 'Dr. Johnson',
    status: 'Active',
    dietCategory: 'diabetic',
    calorieTarget: '1800',
    proteinTarget: '80',
    foodPreferences: 'Sugar-free options',
    foodAvoidances: 'High carb foods',
    allergyAvoidances: 'None'
  }
];

const DietaryRequests = () => {
  const [requests, setRequests] = useState(sampleRequests);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState(initialForm);
  //LOV
  const { data: dietOrderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DIET_ORDER_TYPE');
  const { data: durationLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: mealTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DIET_MEAL_TYPES');
  const { data: portionSizeLovQueryResponse } = useGetLovValuesByCodeQuery('SMALL_MED_LARG');
  const { data: dietCategoryLovQueryResponse } = useGetLovValuesByCodeQuery(
    'THERAPUTIC_DIET_CATEGORY'
  );
  const { data: deliveryMethodLovQueryResponse } = useGetLovValuesByCodeQuery('IV_FREQUENCY');
  const { data: lineTypeMethodLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_ROUTE');
  //handles
  const handleAddNewRequest = () => {
    setModalMode('add');
    setForm(initialForm);
    setSelectedRequest(null);
    setModalOpen(true);
  };

  const handleViewRequest = request => {
    console.log('Viewing request:', request);
    setModalMode('view');
    setSelectedRequest(request);
    setForm({ ...request });
    setModalOpen(true);
  };
  // forms
  const renderBasicFields = () => (
    <>
      <MyInput
        fieldLabel="Diet Order Type"
        fieldName="dietOrderType"
        fieldType="select"
        selectData={dietOrderTypeLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={form}
        setRecord={prev => {
          setForm({
            ...prev,
            dietOrderType: prev.dietOrderType
          });
        }}
        onChange={value => {
          setForm(prev => ({
            ...prev,
            dietOrderType: value
          }));
        }}
        required
        width={250}
        disabled={modalMode === 'view'}
        searchable={false}
      />

      <MyInput
        fieldLabel="Start Date & Time"
        fieldName="startDateTime"
        fieldType="datetime"
        record={form}
        setRecord={setForm}
        required
        width={250}
        disabled={modalMode === 'view'}
      />
      <div className="two">
        <MyInput
          fieldLabel="Duration"
          fieldName="duration"
          fieldType="number"
          record={form}
          setRecord={setForm}
          required
          width={120}
          disabled={modalMode === 'view'}
        />
        <MyInput
          className="sec"
          fieldLabel=""
          fieldName="durationUnit"
          fieldType="select"
          selectData={durationLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={form}
          setRecord={setForm}
          width={120}
          disabled={modalMode === 'view'}
          searchable={false}
        />
      </div>

      <MyInput
        fieldLabel="Food Preferences"
        fieldName="foodPreferences"
        fieldType="textarea"
        record={form}
        setRecord={setForm}
        width={250}
        disabled={modalMode === 'view'}
      />
      <MyInput
        fieldLabel="Food Avoidances"
        fieldName="foodAvoidances"
        fieldType="textarea"
        record={form}
        setRecord={setForm}
        width={250}
        disabled={modalMode === 'view'}
      />
      <MyInput
        fieldLabel="Allergy Avoidances"
        fieldName="allergyAvoidances"
        fieldType="textarea"
        record={form}
        setRecord={setForm}
        width={250}
        disabled={modalMode === 'view'}
      />
    </>
  );
  const renderConditionalField = () => {
    const isDisabled = modalMode === 'view';

    switch (form.dietOrderType) {
      case 'regular':
        return (
          <>
            <MyInput
              fieldLabel="Meal Type"
              fieldName="mealType"
              fieldType="select"
              selectData={mealTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              required
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
            <MyInput
              fieldLabel="Portion Size"
              fieldName="portionSize"
              fieldType="select"
              selectData={portionSizeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              required
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
          </>
        );
      case 'therapeutic':
        return (
          <>
            <MyInput
              fieldLabel="Diet Category"
              fieldName="dietCategory"
              fieldType="select"
              selectData={dietCategoryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              required
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
            <MyInput
              fieldLabel="Calorie Target"
              fieldName="calorieTarget"
              fieldType="number"
              record={form}
              setRecord={setForm}
              required
              width={120}
              rightAddon="kcal"
              rightAddonwidth={50}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Protein Target"
              fieldName="proteinTarget"
              fieldType="number"
              record={form}
              setRecord={setForm}
              required
              width={120}
              rightAddon="g"
              disabled={isDisabled}
            />
          </>
        );
      case 'texture':
        return (
          <div>
            <Text>Texture Level</Text>
            <RadioGroup inline>
              <Radio value="Pureed">Pureed</Radio>
              <Radio value="Minced">Minced</Radio>
              <Radio value="Soft">Soft</Radio>
              <Radio value="Liquidized">Liquidized</Radio>
            </RadioGroup>

            <div className="margin-top">
              <Text>Fluid Consistency</Text>
              <RadioGroup inline>
                <Radio value="Thin">Thin</Radio>
                <Radio value="Nectar-Thick">Nectar-Thick</Radio>
                <Radio value="Honey-Thick">Honey-Thick</Radio>
              </RadioGroup>
            </div>
          </div>
        );
      case 'npo':
        return (
          <MyInput
            fieldLabel="Reason"
            fieldName="reason"
            fieldType="text"
            record={form}
            setRecord={setForm}
            required
            width={250}
            disabled={isDisabled}
          />
        );
      case 'fluid':
        return (
          <MyInput
            fieldLabel="Daily Volume Limit"
            fieldName="dailyVolumeLimit"
            fieldType="number"
            record={form}
            setRecord={setForm}
            required
            width={120}
            rightAddon="ml"
            disabled={isDisabled}
          />
        );
      case 'enteral':
        return (
          <>
            <MyInput
              fieldLabel="Formula Name"
              fieldName="formulaName"
              fieldType="select"
              selectData={[
                { key: 'formula1', lovDisplayVale: 'Formula 1' },
                { key: 'formula2', lovDisplayVale: 'Formula 2' }
              ]}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              required
              width={250}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Delivery Method"
              fieldName="deliveryMethod"
              fieldType="select"
              selectData={deliveryMethodLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              required
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
            <MyInput
              fieldLabel="Rate"
              fieldName="rate"
              fieldType="number"
              record={form}
              setRecord={setForm}
              required
              width={120}
              rightAddon="ml/hr"
              rightAddonwidth={60}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Volume per feed"
              fieldName="volumePerFeed"
              fieldType="number"
              record={form}
              setRecord={setForm}
              required
              width={120}
              rightAddon="ml"
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Number of feeds/day"
              fieldName="feedsPerDay"
              fieldType="number"
              record={form}
              setRecord={setForm}
              required
              width={120}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Additional Instructions"
              fieldName="additionalInstructions"
              fieldType="textarea"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
            />
          </>
        );
      case 'parenteral':
        return (
          <>
            <MyInput
              fieldLabel="Formula Composition"
              fieldName="formulaComposition"
              fieldType="text"
              record={form}
              setRecord={setForm}
              required
              width={250}
              placeholder="Enter tags separated by comma"
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Infusion Rate"
              fieldName="infusionRate"
              fieldType="number"
              record={form}
              setRecord={setForm}
              required
              width={120}
              rightAddon="ml/hr"
              rightAddonwidth={60}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Infusion Duration"
              fieldName="infusionDuration"
              fieldType="number"
              record={form}
              setRecord={setForm}
              required
              width={120}
              rightAddon="hours"
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Line Type"
              fieldName="lineType"
              fieldType="select"
              selectData={lineTypeMethodLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              required
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
          </>
        );
      default:
        return null;
    }
  };
  const renderConditionalFields = () => {
    const isDisabled = modalMode === 'view';

    switch (form.dietOrderType) {
      // TODO convert key to code
      case '9487510426587150':
        return (
          <>
            <MyInput
              fieldLabel="Meal Type"
              fieldName="mealType"
              fieldType="select"
              selectData={mealTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
            <MyInput
              fieldLabel="Portion Size"
              fieldName="portionSize"
              fieldType="select"
              selectData={portionSizeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
          </>
        );
      // TODO convert key to code
      case '9487527629315307':
        return (
          <>
            <MyInput
              fieldLabel="Diet Category"
              fieldName="dietCategory"
              fieldType="select"
              selectData={dietCategoryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
            <MyInput
              fieldLabel="Calorie Target"
              fieldName="calorieTarget"
              fieldType="number"
              record={form}
              setRecord={setForm}
              width={120}
              rightAddon="kcal"
              rightAddonwidth={50}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Protein Target"
              fieldName="proteinTarget"
              fieldType="number"
              record={form}
              setRecord={setForm}
              width={120}
              rightAddon="g"
              disabled={isDisabled}
            />
          </>
        );
      // TODO convert key to code
      case '9583433916270487':
        return (
          <div>
            <Text>Texture Level</Text>
            <RadioGroup inline>
              <Radio value="Pureed">Pureed</Radio>
              <Radio value="Minced">Minced</Radio>
              <Radio value="Soft">Soft</Radio>
              <Radio value="Liquidized">Liquidized</Radio>
            </RadioGroup>

            <div className="margin-top">
              <Text>Fluid Consistency</Text>
              <RadioGroup inline>
                <Radio value="Thin">Thin</Radio>
                <Radio value="Nectar-Thick">Nectar-Thick</Radio>
                <Radio value="Honey-Thick">Honey-Thick</Radio>
              </RadioGroup>
            </div>
          </div>
        );
      // TODO convert key to code
      case '9583445779340729':
        return (
          <MyInput
            fieldLabel="Reason"
            fieldName="reason"
            fieldType="text"
            record={form}
            setRecord={setForm}
            width={250}
            disabled={isDisabled}
          />
        );
      // TODO convert key to code
      case '9583463461702679':
        return (
          <MyInput
            fieldLabel="Daily Volume Limit"
            fieldName="dailyVolumeLimit"
            fieldType="number"
            record={form}
            setRecord={setForm}
            width={120}
            rightAddon="ml"
            disabled={isDisabled}
          />
        );
      // TODO convert key to code
      case '9583509741073933':
        return (
          <>
            <MyInput
              fieldLabel="Formula Name"
              fieldName="formulaName"
              fieldType="select"
              selectData={[
                { key: 'formula1', lovDisplayVale: 'Formula 1' },
                { key: 'formula2', lovDisplayVale: 'Formula 2' }
              ]}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Delivery Method"
              fieldName="deliveryMethod"
              fieldType="select"
              selectData={deliveryMethodLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
            <MyInput
              fieldLabel="Rate"
              fieldName="rate"
              fieldType="number"
              record={form}
              setRecord={setForm}
              width={120}
              rightAddon="ml/hr"
              rightAddonwidth={60}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Volume per feed"
              fieldName="volumePerFeed"
              fieldType="number"
              record={form}
              setRecord={setForm}
              width={120}
              rightAddon="ml"
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Number of feeds/day"
              fieldName="feedsPerDay"
              fieldType="number"
              record={form}
              setRecord={setForm}
              width={120}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Additional Instructions"
              fieldName="additionalInstructions"
              fieldType="textarea"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
            />
          </>
        );
      // TODO convert key to code
      case '9583532408326686':
        return (
          <>
            <MyInput
              fieldLabel="Formula Composition"
              fieldName="formulaComposition"
              fieldType="text"
              record={form}
              setRecord={setForm}
              width={250}
              placeholder="Enter tags separated by comma"
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Infusion Rate"
              fieldName="infusionRate"
              fieldType="number"
              record={form}
              setRecord={setForm}
              width={120}
              rightAddon="ml/hr"
              rightAddonwidth={60}
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Infusion Duration"
              fieldName="infusionDuration"
              fieldType="number"
              record={form}
              setRecord={setForm}
              width={120}
              placeholder="hours"
              disabled={isDisabled}
            />
            <MyInput
              fieldLabel="Line Type"
              fieldName="lineType"
              fieldType="select"
              selectData={lineTypeMethodLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
              width={250}
              disabled={isDisabled}
              searchable={false}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="div-button">
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
          onClick={handleAddNewRequest}
        >
          Add New Request
        </MyButton>
      </div>

      <MyTable
        data={requests}
        columns={[
          {
            key: 'dietOrderType',
            title: 'Diet Order Type',
            dataKey: 'dietOrderType',
            width: 160
          },
          {
            key: 'startDateTime',
            title: 'Start Date Time',
            dataKey: 'startDateTime',
            width: 160,
            render: (rowData: any) =>
              rowData?.startDateTime ? (
                <>
                  {rowData.startDate}
                  <br />
                  <span className="date-table-style">{rowData.startTime}</span>
                </>
              ) : (
                ' '
              )
          },
          {
            key: 'duration',
            title: 'Duration',
            dataKey: 'duration',
            width: 100,
            render: row => `${row.duration} ${row.durationUnit}`
          },
          { key: 'orderedBy', title: 'Ordered By\\At', dataKey: 'orderedBy', width: 160 },
          { key: 'status', title: 'Status', dataKey: 'status', width: 100 },
          {
            key: 'view',
            title: 'View',
            width: 80,
            render: row => (
              <div
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.stopPropagation();
                  handleViewRequest(row);
                }}
              >
                <FontAwesomeIcon icon={faEye} className="font-aws" />
              </div>
            )
          }
        ]}
        height={470}
        loading={false}
      />

      <MyModal
        open={modalOpen}
        setOpen={setModalOpen}
        title={modalMode === 'add' ? 'New Dietary Request' : 'View Dietary Request'}
        content={
          <Form fluid className="fields-container">
            {renderBasicFields()}
            {renderConditionalFields()}
            {renderConditionalField()}
          </Form>
        }
      />
    </>
  );
};

export default DietaryRequests;
