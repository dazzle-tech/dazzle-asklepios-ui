import React, { useCallback, useMemo, useState } from 'react';
import { Divider, Popover, Whisper } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setSelectedDepartment } from '@/reducers/authSlice';
import { useGetActiveUserDepartmentsByUserQuery } from '@/services/security/userDepartmentsService';

export type SyncedDepartment = {
  departmentId?: string | number | null;
  facilityId?: string | number | null;
  departmentName?: string | null;
  facilityName?: string | null;
};

type UserDepartmentWithNames = {
  id?: string | number;
  userId?: string | number;
  departmentId?: string | number | null;
  facilityId?: string | number | null;
  departmentName?: string | null;
  facilityName?: string | null;
  isDefault?: boolean;
};

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
  afterSelect,
  beforeSelect
}: DepartmentSwitcherProps) => {
  const mode = useAppSelector((state: any) => state.ui.mode);
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const [openedOnce, setOpenedOnce] = useState(false);

  const isDark = mode === 'dark';

  const userId = authSlice.user?.id;
  const selectedDepartment = authSlice.selectedDepartment;

  const selectedFacilityId =
    selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const facilityKey = selectedFacilityId ?? 'no-facility';

  const {
    data: activeDepartmentsResponse,
    isLoading,
    isFetching
  } = useGetActiveUserDepartmentsByUserQuery(
    { userId: userId as number, facilityId: facilityKey },
    {
      skip: !openedOnce || !userId || !selectedFacilityId,
      refetchOnMountOrArgChange: false
    }
  );

  const activeDepartments = useMemo(
    () => (activeDepartmentsResponse ?? []) as UserDepartmentWithNames[],
    [activeDepartmentsResponse]
  );

  const headerFacilityName =
    selectedDepartment?.facilityName ??
    authSlice?.tenant?.selectedFacility?.name ??
    authSlice?.tenant?.selectedFacility?.facilityName ??
    '-';

  const headerDepartmentName = selectedDepartment?.departmentName ?? '-';

  const selectDepartment = useCallback(
    (dept: UserDepartmentWithNames, closePopover?: () => void) => {
      const nextDepartment: SyncedDepartment = {
        departmentId: dept.departmentId ?? null,
        facilityId: dept.facilityId ?? null,
        departmentName: dept.departmentName ?? null,
        facilityName: dept.facilityName ?? null
      };

      const isSameDepartment =
        String(selectedDepartment?.departmentId ?? '') ===
          String(nextDepartment.departmentId ?? '') &&
        String(selectedDepartment?.facilityId ?? '') === String(nextDepartment.facilityId ?? '');

      closePopover?.();
      onClose?.();

      if (isSameDepartment) {
        afterSelect?.();
        return;
      }

      beforeSelect?.(nextDepartment);
      dispatch(setSelectedDepartment(nextDepartment));

      if (reloadOnSelect) {
        setTimeout(() => {
          window.location.reload();
        }, 50);
        return;
      }

      afterSelect?.();
    },
    [
      selectedDepartment?.departmentId,
      selectedDepartment?.facilityId,
      beforeSelect,
      afterSelect,
      dispatch,
      reloadOnSelect,
      onClose
    ]
  );

  const renderSpeaker = useCallback(
    ({ onClose: rsuiteOnClose, left, top, className }: any, ref: React.Ref<any>) => {
      const showLoading = isLoading || isFetching;

      return (
        <Popover ref={ref} className={className} style={{ left, top, width }} full>
          <div
            style={{
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              color: isDark ? '#f5f5f5' : '#111827'
            }}
          >
            <span style={{ fontWeight: 600, color: isDark ? '#f5f5f5' : '#111827' }}>
              My Departments
            </span>

            {showFacilityNameInHeader && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isDark ? '#d4d4d4' : '#374151'
                  }}
                >
                  {headerFacilityName}
                </span>
                <span style={{ fontSize: '11px', color: isDark ? '#8a8a8a' : '#6c757d' }}>
                  {headerDepartmentName}
                </span>
              </div>
            )}
          </div>

          <Divider style={{ margin: 0, borderColor: isDark ? '#333333' : '#e5e7eb' }} />

          <div style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
            {showLoading ? (
              <div style={{ padding: '12px', color: isDark ? '#8a8a8a' : '#6c757d' }}>
                Loading departments...
              </div>
            ) : activeDepartments.length === 0 ? (
              <div style={{ padding: '12px', color: isDark ? '#8a8a8a' : '#6c757d' }}>
                No active departments found.
              </div>
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
                  const isActive =
                    String(selectedDepartment?.departmentId ?? '') ===
                      String(dept.departmentId ?? '') &&
                    String(selectedDepartment?.facilityId ?? '') === String(dept.facilityId ?? '');

                  const departmentDisplayName =
                    dept.departmentName ??
                    (dept as { name?: string | null }).name ??
                    'Unnamed Department';

                  return (
                    <div
                      key={dept.id ?? `${dept.userId}-${dept.departmentId}-${dept.facilityId}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        border: `1px solid ${isDark ? '#333333' : '#e5e7eb'}`,
                        borderRadius: 8,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: isActive
                          ? isDark ? '#2e2e2e' : '#f9fafb'
                          : isDark ? '#1a1a1a' : '#ffffff',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = isDark
                          ? '#2e2e2e'
                          : '#f3f4f6';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = isActive
                          ? isDark ? '#2e2e2e' : '#f9fafb'
                          : isDark ? '#1a1a1a' : '#ffffff';
                      }}
                      onClick={() => selectDepartment(dept, rsuiteOnClose)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontWeight: 600,
                            flex: '1 1 auto',
                            color: isDark ? '#f5f5f5' : '#111827'
                          }}
                        >
                          {departmentDisplayName}
                        </span>

                        {isActive && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: isDark ? '#78350f' : '#facc15',
                              color: isDark ? '#fef9c3' : '#1f2937',
                              padding: '1px 6px',
                              borderRadius: 999
                            }}
                          >
                            Current
                          </span>
                        )}

                        {dept.isDefault && (
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

                      {/* {facilityDisplayName && (
                        <span style={{ fontSize: '11px', color: isDark ? '#8a8a8a' : '#6c757d' }}>
                          {facilityDisplayName}
                        </span>
                      )} */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Popover>
      );
    },
    [
      width,
      maxHeight,
      isLoading,
      isFetching,
      activeDepartments,
      selectedDepartment?.departmentId,
      selectedDepartment?.facilityId,
      showFacilityNameInHeader,
      headerFacilityName,
      headerDepartmentName,
      selectDepartment,
      isDark
    ]
  );

  return (
   <Whisper
      placement={placement}
      trigger={trigger}
      open={controlled ? open : undefined}
      onOpen={() => {
        setOpenedOnce(true);
        onOpen?.();
      }}
      onClose={onClose}
      speaker={renderSpeaker}
    >
      {children}
    </Whisper>
  );
};

export default DepartmentSwitcher;