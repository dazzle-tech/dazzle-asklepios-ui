import MyModal from '@/components/MyModal/MyModal';
import React, { useState, useEffect } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { IoIosListBox } from 'react-icons/io';
import { useGetLovsQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';

const PAGE_SIZE = 15;

const AddEditLov = ({ open, setOpen, width, lov, setLov, handleSave }) => {
  const [parentLovPage, setParentLovPage] = useState(1);
  const [allParentLovs, setAllParentLovs] = useState<any[]>([]);

  const { data: parentLovDropdownResponse, isFetching: loadingParentLovs } = useGetLovsQuery(
    { ...initialListRequest, pageNumber: parentLovPage, pageSize: PAGE_SIZE },
    { skip: !open }
  );

  const { data: selectedParentLovResponse, isFetching: loadingSelected } = useGetLovsQuery(
    {
      ...initialListRequest,
      pageNumber: 1,
      pageSize: 1,
      filters: [{ fieldName: 'key', operator: 'equals', value: lov?.parentLov }]
    },
    { skip: !open || !lov?.parentLov }
  );

  useEffect(() => {
    if (parentLovDropdownResponse?.object) {
      setAllParentLovs(prev =>
        parentLovPage === 1
          ? parentLovDropdownResponse.object
          : [...prev, ...parentLovDropdownResponse.object]
      );
    }
  }, [parentLovDropdownResponse]);

  useEffect(() => {
    if (open) {
      setParentLovPage(1);
      setAllParentLovs([]);
    }
  }, [open]);

  const selectedItem = selectedParentLovResponse?.object?.[0];

  const parentLovSelectData = (() => {
    if (!selectedItem) return allParentLovs;
    const alreadyInList = allParentLovs.some(x => x.key === selectedItem.key);
    if (alreadyInList) return allParentLovs;
    return [selectedItem, ...allParentLovs];
  })();

  const totalCount = parentLovDropdownResponse?.extraNumeric ?? 0;

  // ✅ الحل الصح:
  // نشوف كم item جاب آخر response — لو أقل من PAGE_SIZE معناه خلصت القيم
  const lastPageCount = parentLovDropdownResponse?.object?.length ?? 0;
  const hasMore =
    totalCount > 0 && lastPageCount === PAGE_SIZE && allParentLovs.length < totalCount;

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-two-fields-lov">
              <div className="container-of-my-input-lov">
                <MyInput
                  fieldName="lovCode"
                  record={lov}
                  setRecord={setLov}
                  width="100%"
                  disabled={!!lov?.key}
                />
              </div>
              <div className="container-of-my-input-lov">
                <MyInput fieldName="lovName" record={lov} setRecord={setLov} width="100%" />
              </div>
            </div>
            <br />
            <MyInput
              fieldName="lovDescription"
              fieldType="textarea"
              record={lov}
              setRecord={setLov}
              width="100%"
            />
            <div className="container-of-two-fields-lov">
              <div className="container-of-my-input-lov">
                <MyInput
                  fieldName="defaultValueId"
                  record={lov}
                  disabled={!lov.autoSelectDefault}
                  setRecord={setLov}
                  width="100%"
                />
              </div>
              <div className="container-of-my-input-lov">
                <MyInput
                  fieldName="parentLov"
                  fieldType="selectPagination"
                  selectData={parentLovSelectData}
                  selectDataLabel="lovName"
                  selectDataValue="key"
                  record={lov}
                  setRecord={setLov}
                  width="100%"
                  loading={loadingParentLovs || loadingSelected}
                  hasMore={hasMore}
                  onFetchMore={() => setParentLovPage(prev => prev + 1)}
                />
              </div>
            </div>
            <br />
            <MyInput
              fieldName="autoSelectDefault"
              fieldType="checkbox"
              record={lov}
              setRecord={setLov}
            />
          </Form>
        );
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={lov?.key ? 'Edit LOV' : 'New LOV'}
      position="right"
      content={stepNumber => <div dir={dir}>{conjureFormContent(stepNumber)}</div>}
      actionButtonLabel={lov?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'LOV Info', icon: <IoIosListBox /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditLov;