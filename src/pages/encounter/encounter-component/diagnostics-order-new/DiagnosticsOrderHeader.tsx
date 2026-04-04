import {
  faLandMineOn,
  faPlus,
  faStar,
  faVial
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { GrTestDesktop } from 'react-icons/gr';
import { Checkbox, Divider, Form, Row, SelectPicker } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';

import CheckIcon from '@rsuite/icons/Check';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';

type Props = {
  // data
  orders: any;
  ordersList: any[];

  // state
  filters: any;
  setFilters: (v: any) => void;

  showCanceled: boolean;
  setShowCanceled: (fn: any) => void;

  selectedRows: number[];

  // flags
  isFetching: boolean;
  hasOpenOrder: boolean;
  isSubmitDisabled: boolean;
  edit?: boolean;

  // lookups
  diagTypeResponse: any[];
  labCategoriesLovResponse: any;
  radCategoriesLovResponse: any;

  // actions
  setOrders: (v: any) => void;
  handleClearDiagnostics: () => void;
  handleSaveOrders: () => void;
  handleSubmitPres: () => void;

  setOpenTestsModal: (v: boolean) => void;
  OpenConfirmDeleteModel: () => void;
  setBulkDepartmentModalOpen: (v: boolean) => void;

  setOpenRequestTestModal: (v: boolean) => void;
  setRecallFavoriteModal: (v: boolean) => void;
};

const DiagnosticsOrderHeader: React.FC<Props> = props => {
  const {
    orders,
    ordersList,

    filters,
    setFilters,

    showCanceled,
    setShowCanceled,

    selectedRows,

    isFetching,
    hasOpenOrder,
    isSubmitDisabled,
    edit,

    diagTypeResponse,
    labCategoriesLovResponse,
    radCategoriesLovResponse,

    setOrders,
    handleClearDiagnostics,
    handleSaveOrders,
    handleSubmitPres,

    setOpenTestsModal,
    OpenConfirmDeleteModel,
    setBulkDepartmentModalOpen,

    setOpenRequestTestModal,
    setRecallFavoriteModal
  } = props;

  const orderId = orders?.id ?? orders?.key ?? null;

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <div className="main-container">
      <div className="enhanced-header">
        {/* Row 1 */}
        <div className="header-first-row">
          <SelectPicker
            data={ordersList ?? []}
            labelKey="orderNumber"
            valueKey="id"
            placeholder="Orders"
            value={orders?.id ?? null}
            onChange={value => {
              const selectedItem = (ordersList ?? []).find(item => item.id === value) ?? {};
              setOrders(selectedItem);
              handleClearDiagnostics();
            }}
          />

          <div className="top-container">
            <div className="icon-style">
              <GrTestDesktop size={18} />
            </div>

            <div>
              <div className="prescripton-word-style">Order</div>
              <div className="prescripton-number-style">{orders?.orderNumber ?? '_'}</div>
            </div>
          </div>

          <div className="buttons-group">
            <MyButton
              loading={isFetching}
              onClick={handleSaveOrders}
              prefixIcon={() => <PlusIcon />}
              disabled={hasOpenOrder}
            >
              New Order
            </MyButton>

            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faLandMineOn} />}
              onClick={() => setOrders({ ...orders, isUrgent: !orders.isUrgent })}
              backgroundColor={orders.isUrgent ? 'var(--primary-orange)' : 'var(--primary-blue)'}
              disabled={
                edit
                  ? true
                  : orders.id
                    ? orders?.status !== 'NEW' && orders?.statusLkey !== '164797574082125'
                    : true
              }
            >
              Urgent
            </MyButton>
          </div>
        </div>

        {/* Row 2 - Filters */}
        <div className="header-second-row">
          <Form fluid layout="inline">
            <MyInput
              column
              width={160}
              fieldName="testName"
              fieldType="text"
              fieldLabel="Test Name"
              record={filters}
              setRecord={setFilters}
            />

            <MyInput
              column
              width={160}
              fieldName="type"
              fieldType="select"
              selectData={diagTypeResponse ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={filters}
              setRecord={rec =>
                setFilters({
                  ...rec,
                  category: '',
                  catalog: ''
                })
              }
              searchable={false}
            />

            {filters.type && (
              <MyInput
                column
                fieldName="category"
                fieldType="select"
                fieldLabel="Category"
                width={240}
                selectData={
                  filters.type === 'LABORATORY'
                    ? labCategoriesLovResponse?.object ?? []
                    : filters.type === 'RADIOLOGY'
                      ? radCategoriesLovResponse?.object ?? []
                      : []
                }
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={filters}
                setRecord={setFilters}
                searchable={false}
              />
            )}
          </Form>
        </div>

        {/* Row 3 - Actions */}
        <div className="header-third-row">
          <MyButton onClick={() => setOpenRequestTestModal(true)} appearance="ghost">
            <FontAwesomeIcon icon={faVial} /> Request New TestSetup
          </MyButton>

          <MyButton disabled={isSubmitDisabled} onClick={() => setRecallFavoriteModal(true)}>
            <FontAwesomeIcon icon={faStar} /> Recall Favorite
          </MyButton>

          <MyButton onClick={handleSubmitPres} disabled={isSubmitDisabled} prefixIcon={() => <CheckIcon />}>
            Sign &amp; Submit
          </MyButton>
        </div>
      </div>

      <Row>
        <Divider />
      </Row>

      {/* Row 4 - Table actions */}
      <Row>
        <div className="top-container">
          <div className="buttons-sect">
            <Checkbox checked={showCanceled} disabled={!orderId} onChange={() => setShowCanceled((p: boolean) => !p)}>
              Show Canceled
            </Checkbox>

            <MyButton disabled={isSubmitDisabled} onClick={() => setOpenTestsModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Add Test
            </MyButton>

            <MyButton
              disabled={orders.id ?? orders.key ? selectedRows.length === 0 : true}
              prefixIcon={() => <CloseOutlineIcon />}
              onClick={OpenConfirmDeleteModel}
            >
              Cancel
            </MyButton>

            <MyButton disabled={selectedRows.length === 0} onClick={() => setBulkDepartmentModalOpen(true)}>
              Assign Department
            </MyButton>
          </div>
        </div>
      </Row>
    </div>
  </div>
  );
};

export default DiagnosticsOrderHeader;
