import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import CancellationModal from '@/components/CancellationModal';
import MyModal from '@/components/MyModal/MyModal';

import BulkAssignDepartmentModal from './BulkAssignDepartmentModal';
import DetailsModal from './DetailsModal';
import RecallFavoriteDiagnosticOrdersModal from './RecallFavoriteDiagnosticOrdersModal';
import RequestTestModal from './RequestTestModal';
import TestCardModal from './TestCardModal';
import TransferList from './TransferTestList';

import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';

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
  handleCancle: () => void;

  orderTestRefetch: () => any;
  setSelectedRows: (v: number[]) => void;

  handleRecallFavoriteTest: (t: any) => Promise<void> | void;
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
    handleCancle,

    orderTestRefetch,
    setSelectedRows,

    handleRecallFavoriteTest
  } = props;

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


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
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title={`Attachments - ${test?.test?.testName ?? test?.testName ?? ''}`}
        size="lg"
        hideActionBtn
        content={
          attachmentsModalOpen ? (
            <EncounterAttachment
              localEncounter={encounter}
              source="DIAGNOSTIC_ORDER_ATTACHMENT"
              sourceId={test?.id ? Number(test.id) : undefined}
              refetchAttachmentList={false}
              setRefetchAttachmentList={() => { }}
            />
          ) : null
        }
      />

      <MyModal
        open={openTestsModal}
        setOpen={setOpenTestsModal}
        title="Select Tests"
        actionButtonFunction={handleSaveTests}
        size="50vw"
        content={
        <div dir={dir}>
          <TransferList
            open={openTestsModal}
            leftItems={leftItems}
            rightItems={rightItems}
            setLeftItems={setLeftItems}
            setRightItems={setRightItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchType={searchType}
            setSearchType={setSearchType}
            isFetching={isFetching}
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
        onSuccess={() => { }}
      />

      <MyModal
        open={testCardModal}
        setOpen={setTestCardModal}
        title="Test Card"
        size="42vw"
        position="center"
        steps={[{ title: '', icon: <FontAwesomeIcon icon={faCreditCard} /> }]}
        content={
          testCardModal ? (
            <div dir={dir}>
              <TestCardModal orderTest={orderTest} test={test} />
            </div>
          ) : null
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
      />

      <RecallFavoriteDiagnosticOrdersModal
        open={recallFavoriteModal}
        setOpen={setRecallFavoriteModal}
        favoriteTests={favoriteTests ?? []}
        loading={loadingFavorites}
        onRecall={tests => {
          Promise.all(tests.map((t: any) => handleRecallFavoriteTest(t)));
        }}
      />
    </div>
  );
};

export default DiagnosticsOrderModals;
