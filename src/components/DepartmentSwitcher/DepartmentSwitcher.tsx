import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Divider, Popover, Whisper } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setSelectedDepartment } from '@/reducers/authSlice';
import {
  useGetActiveUserDepartmentsByUserQuery,
  useGetDefaultUserDepartmentByUserQuery
} from '@/services/security/userDepartmentsService';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { UserDepartment } from '@/types/model-types-new';
import { conjureValueBasedOnIDFromList } from '@/utils';
import { notify } from '@/utils/uiReducerActions';

export type SyncedDepartment = {
  departmentId?: string | number | null;
  facilityId?: string | number | null;
  departmentName?: string | null;
  facilityName?: string | null;
};

type UserDepartmentWithNames = UserDepartment & {
  departmentName?: string | null;
  facilityName?: string | null;
};

const SELECTED_DEPARTMENT_STORAGE_KEY = 'selectedDepartment';
const DEPARTMENT_CHANNEL_NAME = 'department_channel';

interface DepartmentSwitcherProps {
  children: React.ReactElement;
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'bottomStart'
    | 'bottomEnd'
    | 'topStart'
    | 'topEnd'
    | 'leftStart'
    | 'leftEnd'
    | 'rightStart'
    | 'rightEnd';
  trigger?: 'click' | 'hover' | 'contextMenu' | 'active';
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  controlled?: boolean;
  width?: number;
  maxHeight?: number;
  showFacilityNameInHeader?: boolean;
  reloadOnSelect?: boolean;
  enableCrossTabSync?: boolean;
  afterSelect?: () => void;
  beforeSelect?: (nextDepartment: SyncedDepartment) => void;
}

const DepartmentSwitcher = ({
  children,
  placement = 'bottomEnd',
  trigger = 'click',
  open,
  onOpen,
  onClose,
  controlled = false,
  width = 320,
  maxHeight = 240,
  showFacilityNameInHeader = true,
  reloadOnSelect = false,
  enableCrossTabSync = false,
  afterSelect,
  beforeSelect
}: DepartmentSwitcherProps) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const { data: departmentsResponse } = useGetDepartmentsQuery({ page: 0, size: 10000 });
  const departments = departmentsResponse?.data ?? [];

  const { data: facilitiesResponse } = useGetAllFacilitiesQuery({});
  const facilities = Array.isArray(facilitiesResponse) ? facilitiesResponse : [];

  const didNotifyNoDepartmentsRef = useRef(false);

  const userId = authSlice.user?.id;
  const selectedDepartment = authSlice.selectedDepartment;

  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const selectedFacilityName =
    authSlice?.tenant?.selectedFacility?.name ??
    authSlice?.tenant?.selectedFacility?.facilityName ??
    null;

  const facilityKey = selectedFacilityId ?? 'no-facility';

  const {
    data: activeDepartmentsResponse,
    isLoading: isLoadingActiveDepartments,
    isFetching: isFetchingActiveDepartments
  } = useGetActiveUserDepartmentsByUserQuery(
    { userId: userId as number, facilityId: facilityKey },
    {
      skip: !userId,
      refetchOnMountOrArgChange: true
    }
  );

  const activeDepartments = useMemo(
    () => (activeDepartmentsResponse ?? []) as UserDepartmentWithNames[],
    [activeDepartmentsResponse]
  );

  const storedDepartmentMatch =
    selectedDepartment &&
    activeDepartments.find(
      dept =>
        dept?.departmentId === selectedDepartment.departmentId &&
        dept?.facilityId === selectedDepartment.facilityId
    );

  const defaultDepartmentLocal = activeDepartments.find(dept => dept?.isDefault) ?? null;
  const shouldFetchDefault = !defaultDepartmentLocal && Boolean(userId);

  const { data: defaultDepartmentResponse } = useGetDefaultUserDepartmentByUserQuery(
    userId as number,
    {
      skip: !shouldFetchDefault
    }
  );

  const defaultDepartment = (defaultDepartmentResponse ?? null) as UserDepartmentWithNames | null;
  const defaultDepartmentEntity = defaultDepartmentLocal ?? defaultDepartment ?? null;

  const selectedDepartmentEffective = useMemo(() => {
    return (
      storedDepartmentMatch ??
      defaultDepartmentEntity ??
      (activeDepartments.length > 0 ? activeDepartments[0] : null)
    );
  }, [storedDepartmentMatch, defaultDepartmentEntity, activeDepartments]);

  const resolveFacilityName = useCallback(
    (facilityId?: string | number | null) => {
      if (facilityId != null) {
        const resolved =
          conjureValueBasedOnIDFromList(facilities as any[], facilityId, 'name') ??
          (facilityId ? `Facility #${facilityId}` : undefined);

        if (resolved) return resolved;
      }

      const tenantFacility = authSlice?.tenant?.selectedFacility;
      return tenantFacility?.name ?? tenantFacility?.facilityName ?? undefined;
    },
    [facilities, authSlice?.tenant?.selectedFacility]
  );

  const resolveDepartmentName = useCallback(
    (departmentId?: string | number | null) => {
      if (departmentId == null) return undefined;

      return (
        conjureValueBasedOnIDFromList(departments as any[], departmentId, 'name') ??
        (departmentId ? `Department #${departmentId}` : undefined)
      );
    },
    [departments]
  );

  useEffect(() => {
    if (!authSlice?.user?.id || !authSlice?.tenant?.selectedFacility) {
      return;
    }

    if (
      activeDepartments.length === 0 &&
      !isLoadingActiveDepartments &&
      !isFetchingActiveDepartments &&
      !selectedDepartment
    ) {
      if (!didNotifyNoDepartmentsRef.current) {
        dispatch(
          notify({
            type: 'warning',
            message:
              'No departments are assigned to your user. Please contact the administrator to configure departments.'
          })
        );
        didNotifyNoDepartmentsRef.current = true;
      }
      return;
    }

    if (!selectedDepartmentEffective) {
      return;
    }

    const nextDepartmentId = selectedDepartmentEffective.departmentId;
    const nextFacilityId = selectedDepartmentEffective.facilityId;

    const isSameDepartment =
      String(selectedDepartment?.departmentId ?? '') === String(nextDepartmentId ?? '') &&
      String(selectedDepartment?.facilityId ?? '') === String(nextFacilityId ?? '');

    if (isSameDepartment) {
      return;
    }

    dispatch(
      setSelectedDepartment({
        departmentId: nextDepartmentId,
        facilityId: nextFacilityId,
        departmentName: resolveDepartmentName(nextDepartmentId) ?? null,
        facilityName: resolveFacilityName(nextFacilityId) ?? null
      })
    );
  }, [
    authSlice?.user?.id,
    authSlice?.tenant?.selectedFacility?.id,
    activeDepartments.length,
    isLoadingActiveDepartments,
    isFetchingActiveDepartments,
    selectedDepartment,
    selectedDepartment?.departmentId,
    selectedDepartment?.facilityId,
    selectedDepartmentEffective,
    selectedDepartmentEffective?.departmentId,
    selectedDepartmentEffective?.facilityId,
    resolveDepartmentName,
    resolveFacilityName,
    dispatch
  ]);

  const selectDepartment = useCallback(
    (dept: UserDepartmentWithNames) => {
      const nextDepartment: SyncedDepartment = {
        departmentId: dept.departmentId,
        facilityId: dept.facilityId,
        departmentName: dept.departmentName ?? resolveDepartmentName(dept.departmentId) ?? null,
        facilityName: dept.facilityName ?? resolveFacilityName(dept.facilityId) ?? null
      };

      const isSameDepartment =
        String(selectedDepartment?.departmentId ?? '') === String(nextDepartment.departmentId ?? '') &&
        String(selectedDepartment?.facilityId ?? '') === String(nextDepartment.facilityId ?? '');

      if (isSameDepartment) {
        onClose?.();
        afterSelect?.();
        return;
      }

      beforeSelect?.(nextDepartment);
      dispatch(setSelectedDepartment(nextDepartment));

      if (enableCrossTabSync) {
        try {
          localStorage.setItem(SELECTED_DEPARTMENT_STORAGE_KEY, JSON.stringify(nextDepartment));
        } catch {}

        try {
          const channel = new BroadcastChannel(DEPARTMENT_CHANNEL_NAME);
          channel.postMessage({
            type: 'DEPARTMENT_CHANGED',
            payload: nextDepartment
          });
          channel.close();
        } catch (error) {
          console.error('BroadcastChannel is not available', error);
        }
      }

      if (reloadOnSelect) {
        setTimeout(() => {
          window.location.reload();
        }, 50);
        return;
      }

      afterSelect?.();
    },
    [
      afterSelect,
      beforeSelect,
      dispatch,
      enableCrossTabSync,
      reloadOnSelect,
      resolveDepartmentName,
      resolveFacilityName,
      selectedDepartment?.departmentId,
      selectedDepartment?.facilityId,
      onClose
    ]
  );

  const hasDepartments = activeDepartments.length > 0;
  const showLoading = !hasDepartments && (isLoadingActiveDepartments || isFetchingActiveDepartments);
  const headerFacilityName =
    selectedDepartment?.facilityName ?? selectedFacilityName ?? '-';
  const headerDepartmentName =
    selectedDepartment?.departmentName ??
    resolveDepartmentName(selectedDepartment?.departmentId) ??
    '-';

  const renderSpeaker = useCallback(
    ({ onClose: rsuiteOnClose, left, top, className }: any, ref: React.Ref<any>) => (
      <Popover ref={ref} className={className} style={{ left, top, width }} full>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>My Departments</span>

          {showFacilityNameInHeader && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                {headerFacilityName}
              </span>
              <span style={{ fontSize: '11px', color: '#6c757d' }}>
                {headerDepartmentName}
              </span>
            </div>
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        {showLoading ? (
          <div style={{ padding: '12px' }}>Loading departments...</div>
        ) : activeDepartments.length === 0 ? (
          <div style={{ padding: '12px' }}>No active departments found.</div>
        ) : (
          <div
            style={{
              maxHeight,
              overflowY: 'auto',
              margin: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            {activeDepartments.map(dept => {
              const isDefault =
                defaultDepartmentEntity?.id != null
                  ? defaultDepartmentEntity.id === dept.id
                  : defaultDepartmentEntity?.departmentId === dept.departmentId &&
                    defaultDepartmentEntity?.facilityId === dept.facilityId;

              const isActive =
                String(selectedDepartment?.departmentId ?? '') === String(dept.departmentId ?? '') &&
                String(selectedDepartment?.facilityId ?? '') === String(dept.facilityId ?? '');

              const departmentDisplayName =
                dept.departmentName ??
                resolveDepartmentName(dept.departmentId) ??
                'Unnamed Department';

              return (
                <div
                  key={dept.id ?? `${dept.userId}-${dept.departmentId}-${dept.facilityId}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    border: '1px solid var(--border-color-light, #e5e7eb)',
                    borderRadius: 8,
                    padding: '8px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      style={{
                        fontWeight: 600,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        flex: '1 1 auto'
                      }}
                      onClick={() => {
                        selectDepartment(dept);
                        onClose?.();
                        rsuiteOnClose?.();
                      }}
                    >
                      {departmentDisplayName}
                    </button>

                    {isActive && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#facc15',
                          color: '#1f2937',
                          padding: '1px 6px',
                          borderRadius: 999
                        }}
                      >
                        Current
                      </span>
                    )}

                    {isDefault && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: 'var(--deep-blue)',
                          color: 'var(--white)',
                          padding: '1px 6px',
                          borderRadius: 999
                        }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Popover>
    ),
    [
      width,
      showFacilityNameInHeader,
      headerFacilityName,
      headerDepartmentName,
      showLoading,
      activeDepartments,
      defaultDepartmentEntity,
      selectedDepartment?.departmentId,
      selectedDepartment?.facilityId,
      maxHeight,
      onClose,
      resolveDepartmentName,
      selectDepartment
    ]
  );

  return (
    <Whisper
      placement={placement}
      trigger={trigger}
      open={controlled ? open : undefined}
      onOpen={onOpen}
      onClose={onClose}
      speaker={renderSpeaker}
    >
      {children}
    </Whisper>
  );
};

export default DepartmentSwitcher;