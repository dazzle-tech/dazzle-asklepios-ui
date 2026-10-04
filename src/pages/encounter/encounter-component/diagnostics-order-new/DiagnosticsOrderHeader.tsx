
import {
  faClock,
  faFileLines,
  faLandMineOn,
  faPlus,
  faStar,
  faVial
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useMemo, useState } from 'react';
import { Checkbox, Divider, Form, Row } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import FavoriteTests from '@/pages/review-results/FavoriteTests';

import CheckIcon from '@rsuite/icons/Check';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import PlusIcon from '@rsuite/icons/Plus';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import { formatDateWithoutSeconds } from '@/utils';

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
  setOpenValidationSummaryModal: (v: boolean) => void;
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
    setOpenValidationSummaryModal,
    OpenConfirmDeleteModel,
    setBulkDepartmentModalOpen,

    setOpenRequestTestModal,
    setRecallFavoriteModal
  } = props;

  const orderId = orders?.id ?? null;

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  const authSlice = useAppSelector(state => state.auth);
  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();
  const isNurse = jobRole === 'NURSE';

  const [openFavoriteTestsModal, setOpenFavoriteTestsModal] = useState(false);

  // Ensure current active / draft order is always included in the orders list, sorted descending with drafts on top
  const displayedOrdersList = useMemo(() => {
    const list = (ordersList ?? []).map(item =>
      orders?.id && String(item.id) === String(orders.id) ? { ...item, ...orders } : item
    );
    if (orders?.id && !list.some(item => String(item.id) === String(orders.id))) {
      list.unshift(orders);
    }

    const isOrderDraft = (item: any) =>
      item?.status === 'NEW' ||
      item?.saveDraft === true ||
      item?.status === 'DRAFT' ||
      (!item?.status && !item?.submittedDate);

    return [...list].sort((a: any, b: any) => {
      const aDraft = isOrderDraft(a);
      const bDraft = isOrderDraft(b);

      // Draft orders always stay at the top
      if (aDraft && !bDraft) return -1;
      if (!aDraft && bDraft) return 1;

      // Descending by createdDate if available
      const timeA = a?.createdDate ? new Date(a.createdDate).getTime() : 0;
      const timeB = b?.createdDate ? new Date(b.createdDate).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }

      // Fallback: descending by id
      const idA = Number(a?.id) || 0;
      const idB = Number(b?.id) || 0;
      return idB - idA;
    });
  }, [ordersList, orders]);

  return (
  <div dir={dir}>
    <div className="main-container">
      <div className="enhanced-header">
        <div className="header-top-grid">
          {/* Left side: Orders modern compact list */}
          <div className="orders-mini-table-container">
            <div className="orders-list-header">
              <span className="orders-list-header-title">
                <Translate>Orders</Translate>
              </span>
              <span className="orders-list-count-badge">
                {displayedOrdersList.length}
              </span>
            </div>

            <div className="orders-compact-list">
              {displayedOrdersList.length === 0 ? (
                <div className="orders-empty-state">
                  <Translate>No orders</Translate>
                </div>
              ) : (
                displayedOrdersList.map((item: any, index: number) => {
                  const isSelected =
                    item?.id && orders?.id && String(item.id) === String(orders.id);

                  const isDraft =
                    item?.status === 'NEW' ||
                    item?.saveDraft === true ||
                    item?.status === 'DRAFT' ||
                    (!item?.status && !item?.submittedDate);

                  const orderLabel =
                    item?.orderNumber || (item?.id ? `#${item.id}` : `Order #${index + 1}`);

                  const dateFormatted = item?.createdDate
                    ? formatDateWithoutSeconds(item.createdDate)
                    : '-';

                  return (
                    <div
                      key={item?.id ?? index}
                      className={`order-compact-card ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setOrders(item ?? {});
                        handleClearDiagnostics();
                      }}
                    >
                      <div className="order-compact-card-left">
                        <div className="order-compact-icon">
                          <FontAwesomeIcon icon={faFileLines} />
                        </div>
                        <div className="order-compact-details">
                          <span className="order-compact-number">{orderLabel}</span>
                          <span className="order-compact-date">
                            <FontAwesomeIcon icon={faClock} style={{ fontSize: 9 }} />
                            {dateFormatted}
                          </span>
                        </div>
                      </div>

                      <div className="order-compact-card-right">
                        {isDraft ? (
                          <span className="order-badge draft">
                            <Translate>Draft</Translate>
                          </span>
                        ) : (
                          <span className="order-badge submitted">
                            <Translate>{item?.status || 'Submitted'}</Translate>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right side: Order-level action buttons */}
          <div className="order-actions-section">
            <div className="order-actions-buttons">
              <MyButton
                loading={isFetching}
                onClick={handleSaveOrders}
                prefixIcon={() => <PlusIcon />}
                disabled={hasOpenOrder || isNurse || edit}
              >
                New Order
              </MyButton>

              <MyButton disabled={edit} onClick={() => setRecallFavoriteModal(true)}>
                <FontAwesomeIcon icon={faStar} /> Recall Favorite
              </MyButton>

              <MyButton onClick={() => setOpenFavoriteTestsModal(true)}>
                <FontAwesomeIcon icon={faStar} /> <Translate>Add Favorite Test</Translate>
              </MyButton>

              <MyButton
                onClick={() => setOpenValidationSummaryModal(true)}
                disabled={isSubmitDisabled || isNurse || edit}
                prefixIcon={() => <CheckIcon />}
              >
                Sign &amp; Submit
              </MyButton>

              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faLandMineOn} />}
                onClick={() => {
                  setOrders({
                    ...orders,
                    isUrgent: !(orders?.isUrgent ?? false)
                  });
                }}
                backgroundColor={orders?.isUrgent ? 'var(--primary-orange)' : 'var(--primary-blue)'}
                disabled={
                  edit ||
                  !orders?.id ||
                  (orders?.status !== 'NEW' && orders?.statusLkey !== '164797574082125')
                }
              >
                Urgent
              </MyButton>
            </div>
          </div>
        </div>
      </div>

      <Row>
        <Divider />
      </Row>

      {/* Row with search filters on left, test action buttons on right */}
      <div className="table-toolbar-row">
        <div className="filter-form-disable-fix filters-left-group">
          <Form fluid layout="inline" className="filter-form-disable-fix">
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
                width={200}
                selectData={
                  filters.type === 'LABORATORY'
                    ? labCategoriesLovResponse?.object ?? []
                    : filters.type === 'RADIOLOGY'
                      ? radCategoriesLovResponse?.object ?? []
                      : []
                }
                selectDataLabel="lovDisplayVale"
                disableByField="isValid"
                selectDataValue="key"
                record={filters}
                setRecord={setFilters}
                searchable={false}
              />
            )}
          </Form>
        </div>

        <div className="buttons-sect">
          <Checkbox checked={showCanceled} disabled={!orderId} onChange={() => setShowCanceled((p: boolean) => !p)} className="show-cancelled">
            <Translate>Show Canceled</Translate>
          </Checkbox>

          <MyButton disabled={isSubmitDisabled || isNurse || edit} onClick={() => setOpenTestsModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> <Translate>Add Test</Translate>
          </MyButton>

          <MyButton
            disabled={isNurse || (orders.id ? selectedRows.length === 0 : true) || edit}
            prefixIcon={() => <CloseOutlineIcon />}
            onClick={OpenConfirmDeleteModel}
          >
            Cancel
          </MyButton>

          <MyButton disabled={isSubmitDisabled || isNurse || selectedRows.length === 0 || edit} onClick={() => setBulkDepartmentModalOpen(true)}>
            Assign Department
          </MyButton>
        </div>
      </div>

      <MyModal
        open={openFavoriteTestsModal}
        setOpen={setOpenFavoriteTestsModal}
        title={<Translate>Favorite Diagnostic Tests</Translate>}
        size="75vw"
        bodyheight="76vh"
        hideActionBtn
        content={
          <div style={{ maxHeight: '72vh', overflowY: 'auto', padding: '10px 5px' }}>
            <FavoriteTests isModal />
          </div>
        }
      />
    </div>
  </div>
  );
};

export default DiagnosticsOrderHeader;
