import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import {
  useCreateNotificationHeaderMutation,
  useUpdateNotificationHeaderMutation,
} from '@/services/notification-management/notificationHeaderService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import {
  NotificationHeaderCreateDTO,
  NotificationHeaderResponseVM,
  NotificationHeaderUpdateDTO,
} from '@/types/model-types-new';
import {
  newNotificationHeaderCreateDTO,
  newNotificationHeaderUpdateDTO,
} from '@/types/model-types-constructor-new';
import { extractErrorMessage } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { MdNotifications } from 'react-icons/md';
import { Col, Form, Row } from 'rsuite';
import '../styles.less';

interface AddEditNotificationHeaderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  header: NotificationHeaderResponseVM;
  refetch: () => void;
}

const AddEditNotificationHeader: React.FC<AddEditNotificationHeaderProps> = ({
  open,
  setOpen,
  header,
  refetch,
}) => {
  const dispatch = useAppDispatch();
  const [createDTO, setCreateDTO] = useState<NotificationHeaderCreateDTO>({
    ...newNotificationHeaderCreateDTO,
  });
  const [updateDTO, setUpdateDTO] = useState<NotificationHeaderUpdateDTO>({
    ...newNotificationHeaderUpdateDTO,
  });

  const [createHeader] = useCreateNotificationHeaderMutation();
  const [updateHeader] = useUpdateNotificationHeaderMutation();
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const moduleOptions = useEnumOptions('NotificationModule');
  const categoryOptions = useEnumOptions('NotificationCategory');
  const priorityOptions = useEnumOptions('NotificationPriority');
  const codeOptions = useEnumOptions('NotificationCode');

  useEffect(() => {
    if (header?.id) {
      setUpdateDTO({
        code: header.code ?? '',
        name: header.name ?? '',
        description: header.description ?? '',
        facilityId: header.facilityId ?? null,
        module: header.module ?? null,
        category: header.category ?? null,
        priority: header.priority ?? null,
        isActive: header.isActive ?? true,
      });
    } else {
      setCreateDTO({ ...newNotificationHeaderCreateDTO });
    }
  }, [header]);

  const handleSubmit = async () => {
    const dto = header?.id ? updateDTO : createDTO;

    let errorMsg = '';
    if (!dto.code) errorMsg = 'Code can’t be empty';
    if (!dto.name?.trim()) {
      errorMsg = errorMsg ? `${errorMsg}, Name can’t be empty` : 'Name can’t be empty';
    }

    if (errorMsg) {
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
      return;
    }

    if (header?.id) {
      await updateHeader({ id: header.id, body: updateDTO })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'The Notification Header was successfully Updated', sev: 'success' }));
          refetch();
          setOpen(false);
          setCreateDTO({ ...newNotificationHeaderCreateDTO });
          setUpdateDTO({ ...newNotificationHeaderUpdateDTO });
        })
        .catch(error => {
          dispatch(
            notify({
              msg: extractErrorMessage(error) || 'Failed to save Notification Header',
              sev: 'warning',
            })
          );
        });
      return;
    }

    await createHeader(createDTO)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The Notification Header was successfully Created', sev: 'success' }));
        refetch();
        setOpen(false);
        setCreateDTO({ ...newNotificationHeaderCreateDTO });
        setUpdateDTO({ ...newNotificationHeaderUpdateDTO });
      })
      .catch(error => {
        dispatch(
          notify({
            msg: extractErrorMessage(error) || 'Failed to save Notification Header',
            sev: 'warning',
          })
        );
      });
  };

  const conjureFormContentOfMainModal = (stepNumber: number) => {
    const dto = header?.id ? updateDTO : createDTO;
    const setDTO = header?.id ? setUpdateDTO : setCreateDTO;

    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-add-edit-notification-header">
              <Row>
                <Col md={12}>
                  <MyInput
                    fieldName="code"
                    fieldType="select"
                    fieldLabel="Code"
                    selectData={codeOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                    required
                    searchable
                  />
                </Col>
                <Col md={12}>
                  <MyInput
                    fieldName="name"
                    fieldType="text"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                    required
                  />
                </Col>
              </Row>
              <Row>
                <MyInput
                  fieldName="description"
                  fieldType="textarea"
                  record={dto}
                  setRecord={setDTO}
                  width="100%"
                />
              </Row>
              <Row>
                <Col md={12}>
                  <MyInput
                    fieldName="facilityId"
                    fieldType="select"
                    fieldLabel="Facility"
                    selectData={facilityListResponse ?? []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                  />
                </Col>
                <Col md={12}>
                  <MyInput
                    fieldName="module"
                    fieldType="select"
                    selectData={moduleOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                  />
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <MyInput
                    fieldName="category"
                    fieldType="select"
                    selectData={categoryOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                  />
                </Col>
                <Col md={12}>
                  <MyInput
                    fieldName="priority"
                    fieldType="select"
                    selectData={priorityOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={dto}
                    setRecord={setDTO}
                    width="100%"
                  />
                </Col>
              </Row>
              <Row>
                <MyInput
                  fieldName="isActive"
                  fieldType="checkbox"
                  record={dto}
                  setRecord={setDTO}
                  width="100%"
                />
              </Row>
            </div>
          </Form>
        );
      default:
        return null;
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      actionButtonLabel={header?.id ? 'Save' : 'Create'}
      actionButtonFunction={handleSubmit}
      open={open}
      setOpen={setOpen}
      position="right"
      title={header?.id ? 'Edit Notification Header' : 'New Notification Header'}
      content={stepNumber => <div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>}
      steps={[{ title: 'Notification Header Info', icon: <MdNotifications /> }]}
      size="sm"
    />
  );
};

export default AddEditNotificationHeader;
