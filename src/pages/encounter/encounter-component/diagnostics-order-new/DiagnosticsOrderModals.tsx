import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect } from 'react';

import CancellationModal from '@/components/CancellationModal';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';

import BulkAssignDepartmentModal from './BulkAssignDepartmentModal';
import DetailsModal from './DetailsModal';
import RecallFavoriteDiagnosticOrdersModal from './RecallFavoriteDiagnosticOrdersModal';
import RequestTestModal from './RequestTestModal';
import TestCardModal from './TestCardModal';
import TestTypeSections from './test-type-sections';

import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import UncoveredInsuranceWarning from '@/components/UncoveredInsuranceWarning';
import { useInsurancePriceListCoverage } from '@/hooks/useInsurancePriceListCoverage';

type Props = {
  // data
  encounter: any;
  orders: any;
  test: any;
  orderTest: any;
  selectedRows: number[];
  selectedOrderTests: any[];

  favoriteTests: any[];
  loadingFavorites: boolean;
  setOrderTest: (v: any) => void;
  edit: boolean;
  // modals state
  openDetailsModel: boolean;
  setOpenDetailsModel: (v: boolean) => void;

  openConfirmDeleteModel: boolean;
  setConfirmDeleteModel: (v: boolean) => void;

  attachmentsModalOpen: boolean;
  setAttachmentsModalOpen: (v: boolean) => void;

  openTestsModal: boolean;
  setOpenTestsModal: (v: boolean) => void;

  openRequestTestModal: boolean;
  setOpenRequestTestModal: (v: boolean) => void;

  recallFavoriteModal: boolean;
  setRecallFavoriteModal: (v: boolean) => void;

  collectSampleModal: boolean;
  setCollectSampleModal: (v: boolean) => void;

  testCardModal: boolean;
  setTestCardModal: (v: boolean) => void;

  bulkDepartmentModalOpen: boolean;
  setBulkDepartmentModalOpen: (v: boolean) => void;

  // transfer list props
  leftItems: any[];
  rightItems: any[];
  setLeftItems: (v: any[]) => void;
  setRightItems: (v: any[]) => void;

  searchTerm: string;
  setSearchTerm: (v: string) => void;

  searchType: any;
  setSearchType: (v: any) => void;

  isFetching: boolean;

  // cancellation
  reson: any;
  setReson: (v: any) => void;

  // deps
  selectedDepartment: any;
  resolveFromDepartmentId: () => any;

  // handlers
  handleSaveTest: () => void;
  handleSaveTests: () => void;
  handleSaveAndSubmitTests: () => void;
  handleCancle: () => void;

  orderTestRefetch: () => any;
  setSelectedRows: (v: number[]) => void;

  handleRecallFavoriteTests: (tests: any[]) => Promise<void> | void;

  handleLoadMore: () => void;
};

const DiagnosticsOrderModals: React.FC<Props> = props => {
  const {
    encounter,
    orders,
    test,
    orderTest,
    setOrderTest,
    edit,
    selectedRows,
    selectedOrderTests,

    favoriteTests,
    loadingFavorites,

    openDetailsModel,
    setOpenDetailsModel,

    openConfirmDeleteModel,
    setConfirmDeleteModel,

    attachmentsModalOpen,
    setAttachmentsModalOpen,

    openTestsModal,
    setOpenTestsModal,

    openRequestTestModal,
    setOpenRequestTestModal,

    recallFavoriteModal,
    setRecallFavoriteModal,

    collectSampleModal,
    setCollectSampleModal,

    testCardModal,
    setTestCardModal,

    bulkDepartmentModalOpen,
    setBulkDepartmentModalOpen,

    leftItems,
    rightItems,
    setLeftItems,
    setRightItems,

    searchTerm,
    setSearchTerm,

    searchType,
    setSearchType,

    isFetching,

    reson,
    setReson,

    selectedDepartment,
    resolveFromDepartmentId,

    handleSaveTest,
    handleSaveTests,
    handleSaveAndSubmitTests,
    handleCancle,

    orderTestRefetch,
    setSelectedRows,
    handleLoadMore,
    handleRecallFavoriteTests
  } = props;

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';
  const { uncoveredItems, checkItems, clearUncoveredItems } = useInsurancePriceListCoverage(
    encounter?.id
  );

  useEffect(() => {
    if (!openTestsModal) {
      clearUncoveredItems();
      return;
    }

    const tests = (rightItems ?? []).filter(item => item?.id);
    if (!tests.length) {
      clearUncoveredItems();
      return;
    }

    void checkItems(
      tests.map((item: any) => ({
        billingItemType: item.type || item.testType || 'LABORATORY',
        diagnosticTestId: Number(item.id ?? item.testId)
      }))
    );
  }, [openTestsModal, rightItems, checkItems, clearUncoveredItems]);

  return (
    <div dir={dir}>
      <DetailsModal
        order={orders}
        test={test}
        openDetailsModel={openDetailsModel}
        setOpenDetailsModel={setOpenDetailsModel}
        orderTest={orderTest}
        setOrderTest={setOrderTest}
        handleSaveTest={handleSaveTest}
        edit={edit}
        patient={encounter?.patient}
        facilityId={encounter?.facilityId}
        encounterId={encounter?.id}
      />

      <CancellationModal
        open={openConfirmDeleteModel}
        setOpen={setConfirmDeleteModel}
        object={reson}
        setObject={setReson}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        fieldLabel={'Cancellation Reason'}
        title={'Cancellation'}
        required={true}
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title={`Attachments - ${test?.testName ?? test?.name ?? ''}`}
        size="lg"
        hideActionBtn
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="DIAGNOSTIC_ORDER_ATTACHMENT"
            sourceId={test?.id ? Number(test.id) : undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => {}}
          />
        }
      />

      <MyModal
        open={openTestsModal}
        setOpen={setOpenTestsModal}
        title="Select Tests"
        actionButtonFunction={handleSaveTests}
        footerButtons={
          <MyButton onClick={handleSaveAndSubmitTests}>Save &amp; Submit</MyButton>
        }
        size="96vw"
        bodyheight="calc(100vh - 230px)"
        content={
          <div dir={dir} className="test-type-sections-modal-content">
            <UncoveredInsuranceWarning items={uncoveredItems} />
            <TestTypeSections
              open={openTestsModal}
              selectedTests={rightItems}
              setSelectedTests={setRightItems}
            />
          </div>
        }
      />

      <MyModal
        open={collectSampleModal}
        setOpen={setCollectSampleModal}
        title="Laboratory Sample Collection"
        size="60vw"
        content={
          <div className="modal-content-padding">
            <p>Sample collection interface and tracking...</p>
          </div>
        }
      />

      <RequestTestModal
        open={openRequestTestModal}
        setOpen={setOpenRequestTestModal}
        fromDepartmentId={resolveFromDepartmentId()}
        fromFacilityId={selectedDepartment?.facilityId}
        onSuccess={() => {}}
      />

      <MyModal
        open={testCardModal}
        setOpen={setTestCardModal}
        title="Test Card"
        size="42vw"
        position="center"
        hideActionBtn={true}
        steps={[{ title: '', icon: <FontAwesomeIcon icon={faCreditCard} /> }]}
        content={
          <div dir={dir}>
            <TestCardModal orderTest={orderTest} test={test} />
          </div>
        }
      />

      <BulkAssignDepartmentModal
        open={bulkDepartmentModalOpen}
        setOpen={setBulkDepartmentModalOpen}
        selectedRows={selectedRows}
        orderTests={selectedOrderTests}
        onSuccess={() => {
          orderTestRefetch();
          setSelectedRows([]);
        }}
        facilityId={encounter?.facilityId}
      />

      <RecallFavoriteDiagnosticOrdersModal
        open={recallFavoriteModal}
        setOpen={setRecallFavoriteModal}
        favoriteTests={favoriteTests ?? []}
        loading={loadingFavorites}
        onRecall={tests => {
          handleRecallFavoriteTests(tests);
        }}
      />
    </div>
  );
};

export default DiagnosticsOrderModals;
