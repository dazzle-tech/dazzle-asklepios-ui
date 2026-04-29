import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import './styles.less';

import DiagnosticsOrderHeader from './DiagnosticsOrderHeader';
import DiagnosticsOrderModals from './DiagnosticsOrderModals';
import DiagnosticsOrderTable from './DiagnosticsOrderTable';
import { useDiagnosticsOrder } from './useDiagnosticsOrder';
import clsx from 'clsx';

const DiagnosticsOrder = (props: any) => {
  const location = useLocation();
  //add new patient edits
  const patient = location.state?.patient;
  const encounter = location.state?.encounter;

  const viewMode = location.state?.viewMode;
  const edit =
    viewMode === 'readOnly' ||
    (props.edit ?? location.state?.edit ?? false);

  const vm = useDiagnosticsOrder({ patient, encounter, edit });

  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(
        `
        .rs-modal, .rs-drawer, .rs-picker-select-menu, .rs-picker-popup,
        .my-modal, .my-popup
      `
      ) !== null
    );
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') vm.handleClearDiagnostics();
    };

    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      if (isInsideModalOrPopup(event.target)) return;

      if (
        vm.tableContainerRef.current &&
        event.target instanceof Node &&
        vm.tableContainerRef.current.contains(event.target)
      ) {
        return;
      }

      vm.handleClearDiagnostics();
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
      <div
    dir={dir}
    className={clsx({ 'disabled-panel': edit })}
  >
      <DiagnosticsOrderHeader
        orders={vm.orders}
        ordersList={vm.ordersList}
        filters={vm.filters}
        setFilters={vm.setFilters}
        showCanceled={vm.showCanceled}
        setShowCanceled={vm.setShowCanceled}
        selectedRows={vm.selectedRows}
        isFetching={vm.isFetching}
        hasOpenOrder={vm.hasOpenOrder}
        isSubmitDisabled={vm.isSubmitDisabled}
        edit={vm.edit}
        diagTypeResponse={vm.diagTypeResponse ?? []}
        labCategoriesLovResponse={vm.labCategoriesLovResponse}
        radCategoriesLovResponse={vm.radCategoriesLovResponse}
        setOrders={vm.setOrders}
        handleClearDiagnostics={vm.handleClearDiagnostics}
        handleSaveOrders={vm.handleSaveOrders}
        handleSubmitPres={vm.handleSubmitPres}
        setOpenTestsModal={vm.setOpenTestsModal}
        OpenConfirmDeleteModel={vm.OpenConfirmDeleteModel}
        setBulkDepartmentModalOpen={vm.setBulkDepartmentModalOpen}
        setOpenRequestTestModal={vm.setOpenRequestTestModal}
        setRecallFavoriteModal={vm.setRecallFavoriteModal}
      />

      <DiagnosticsOrderTable
        tableContainerRef={vm.tableContainerRef}
        orderId={vm.orderId}
        tableVersion={vm.tableVersion}
        loadTests={vm.loadTests}
        normalizedOrderTestList={vm.normalizedOrderTestList}
        selectedRows={vm.selectedRows}
        setSelectedRows={vm.setSelectedRows}
        selectableRowIds={vm.selectableRowIds}
        isAllSelected={vm.isAllSelected}
        isIndeterminate={vm.isIndeterminate}
        handleCheckboxChange={vm.handleCheckboxChange}
        test={vm.test}
        setTest={vm.setTest}
        setAttachmentsModalOpen={vm.setAttachmentsModalOpen}
        normalizeOrderTest={vm.normalizeOrderTest}
        setOrderTest={vm.setOrderTest}
        setTestCardModal={vm.setTestCardModal}
        handleEdit={vm.handleEdit}
        resolveReasonLabel={vm.resolveReasonLabel}
        previewDiagnosticsOrder={vm.previewDiagnosticsOrder}
        setPreviewDiagnosticsOrder={vm.setPreviewDiagnosticsOrder}
        patient={vm.patient}
      />

      <DiagnosticsOrderModals
        encounter={vm.encounter}
        orders={vm.orders}
        test={vm.test}
        orderTest={vm.orderTest}
        selectedRows={vm.selectedRows}
        selectedOrderTests={vm.selectedOrderTests}
        favoriteTests={vm.favoriteTests}
        loadingFavorites={vm.loadingFavorites}
        openDetailsModel={vm.openDetailsModel}
        setOpenDetailsModel={vm.setOpenDetailsModel}
        openConfirmDeleteModel={vm.openConfirmDeleteModel}
        setConfirmDeleteModel={vm.setConfirmDeleteModel}
        attachmentsModalOpen={vm.attachmentsModalOpen}
        setAttachmentsModalOpen={vm.setAttachmentsModalOpen}
        openTestsModal={vm.openTestsModal}
        setOpenTestsModal={vm.setOpenTestsModal}
        openRequestTestModal={vm.openRequestTestModal}
        setOpenRequestTestModal={vm.setOpenRequestTestModal}
        recallFavoriteModal={vm.recallFavoriteModal}
        setRecallFavoriteModal={vm.setRecallFavoriteModal}
        collectSampleModal={vm.collectSampleModal}
        setCollectSampleModal={vm.setCollectSampleModal}
        testCardModal={vm.testCardModal}
        setTestCardModal={vm.setTestCardModal}
        bulkDepartmentModalOpen={vm.bulkDepartmentModalOpen}
        setBulkDepartmentModalOpen={vm.setBulkDepartmentModalOpen}
        leftItems={vm.leftItems}
        rightItems={vm.selectedTestsList}
        setLeftItems={vm.setLeftItems}
        setRightItems={vm.setSelectedTestsList}
        searchTerm={vm.searchTerm}
        setSearchTerm={vm.setSearchTerm}
        searchType={vm.searchType}
        setSearchType={vm.setSearchType}
        isFetching={vm.isFetching}
        reson={vm.reson}
        setReson={vm.setReson}
        selectedDepartment={vm.selectedDepartment}
        resolveFromDepartmentId={vm.resolveFromDepartmentId}
        handleSaveTest={vm.handleSaveTest}
        handleSaveTests={vm.handleSaveTests}
        handleCancle={vm.handleCancle}
        orderTestRefetch={vm.orderTestRefetch}
        setSelectedRows={vm.setSelectedRows}
        handleRecallFavoriteTest={vm.handleRecallFavoriteTest}
        setOrderTest={vm.setOrderTest}
        edit={vm.edit}
        handleLoadMore={vm.handleLoadMore}
      />
    </div>
  );
};

export default DiagnosticsOrder;