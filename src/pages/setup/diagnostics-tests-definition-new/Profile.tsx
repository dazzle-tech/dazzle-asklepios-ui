import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import {
  useCreateDiagnosticTestProfileMutation,
  useGetDiagnosticTestProfilesByTestIdQuery,
  useToggleDiagnosticTestActiveMutation,
  useUpdateDiagnosticTestProfileMutation
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import {
  useCreateDiagnosticTestNormalRangeMutation,
  useDeleteDiagnosticTestNormalRangeMutation,
  useUpdateDiagnosticTestNormalRangeMutation
} from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import {
  newDiagnosticTestNormalRange,
  newDiagnosticTestProfile
} from '@/types/model-types-constructor-new';
import { DiagnosticTestNormalRange, DiagnosticTestProfile } from '@/types/model-types-new';
import { initialListRequest } from '@/types/types';
import NormalRangeSection from './NormalRangeSection';
import ProfileSection from './ProfileSection';
import './styles.less';

const Profile = ({ open, setOpen, diagnosticsTest, selectedProfile }) => {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<DiagnosticTestProfile>({ ...newDiagnosticTestProfile });
  const [normalRange, setNormalRange] = useState<DiagnosticTestNormalRange>({
    ...newDiagnosticTestNormalRange
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [normalRangeFormKey, setNormalRangeFormKey] = useState(0);
  const [profileConfirmationOpen, setProfileConfirmationOpen] = useState(false);
  const [normalRangeDeleteOpen, setNormalRangeDeleteOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 0, size: 5, sort: 'id,asc' });

  const [createProfile] = useCreateDiagnosticTestProfileMutation();
  const [updateProfile] = useUpdateDiagnosticTestProfileMutation();
  const [toggleProfileActive] = useToggleDiagnosticTestActiveMutation();
  const [createNormalRange] = useCreateDiagnosticTestNormalRangeMutation();
  const [updateNormalRange] = useUpdateDiagnosticTestNormalRangeMutation();
  const [deleteNormalRange] = useDeleteDiagnosticTestNormalRangeMutation();

  const { data: unitsResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: lovResponse } = useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });
  const resultTypes = useEnumOptions('TestResultType');
  const {
    data: profilesResponse,
    isFetching,
    refetch: refetchProfiles
  } = useGetDiagnosticTestProfilesByTestIdQuery(
    { testId: diagnosticsTest?.id, ...pagination },
    { skip: !diagnosticsTest?.id }
  );

  useEffect(() => {
    if (!open) {
      setProfile({ ...newDiagnosticTestProfile });
      setNormalRange({ ...newDiagnosticTestNormalRange });
      setSearchKeyword('');
      setProfileConfirmationOpen(false);
      setNormalRangeDeleteOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && diagnosticsTest?.id) refetchProfiles();
  }, [open, diagnosticsTest?.id, refetchProfiles]);

  useEffect(() => {
    if (open && selectedProfile) setProfile(selectedProfile);
  }, [open, selectedProfile]);

  const saveProfile = async () => {
    if (!profile.resultType) {
      dispatch(notify({ msg: 'Result Type is required', sev: 'error' }));
      return;
    }
    try {
      if (profile.id != null) {
        const { isActive, isDefault, ...body } = profile;
        await updateProfile({ id: profile.id, body: { ...body, testId: diagnosticsTest.id } }).unwrap();
        dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      } else {
        const { id, isActive, isDefault, ...body } = profile;
        await createProfile({ ...body, testId: diagnosticsTest.id }).unwrap();
        setProfile({ ...newDiagnosticTestProfile });
        setSearchKeyword('');
        dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
      }
      await refetchProfiles();
    } catch (error: any) {
      const message =
        error?.data?.properties?.message || error?.data?.message || error?.data?.detail || 'Unexpected error';
      dispatch(notify({ msg: message.replace(/^error\./, ''), sev: 'error' }));
    }
  };

  const selectProfile = (nextProfile: DiagnosticTestProfile) => {
    setProfile(current =>
      current.id === nextProfile.id ? { ...newDiagnosticTestProfile } : nextProfile
    );
  };

  const clearProfileForm = () => {
    setProfile({ ...newDiagnosticTestProfile });
    setNormalRange({ ...newDiagnosticTestNormalRange });
    setSearchKeyword('');
    setProfileConfirmationOpen(false);
    setNormalRangeDeleteOpen(false);
    setNormalRangeFormKey(previous => previous + 1);
  };

  const requestProfileToggle = (nextProfile: DiagnosticTestProfile) => {
    setProfile(nextProfile);
    setProfileConfirmationOpen(true);
  };

  const toggleActive = async () => {
    if (profile.isDefault) {
      dispatch(notify({ msg: 'Default profile cannot be deactivated', sev: 'warning' }));
      return;
    }
    try {
      setProfileConfirmationOpen(false);
      await toggleProfileActive(profile.id).unwrap();
      dispatch(
        notify({
          msg: profile.isActive ? 'Profile Deactivated Successfully' : 'Profile Activated Successfully',
          sev: 'success'
        })
      );
      await refetchProfiles();
      setProfile({ ...newDiagnosticTestProfile });
    } catch {
      dispatch(notify({ msg: 'Failed to change profile status', sev: 'error' }));
    }
  };

  const saveNormalRange = async () => {
    const body = {
      ...(normalRange.id && { id: normalRange.id }),
      testId: diagnosticsTest.id,
      profileTestId: profile.id,
      gender: normalRange.gender ?? null,
      condition: normalRange.condition ?? null,
      ageFrom: normalRange.ageFrom,
      ageFromUnit: normalRange.ageFromUnit ?? null,
      ageTo: normalRange.ageTo,
      ageToUnit: normalRange.ageToUnit ?? null,
      resultLov: normalRange.resultLov ?? null,
      normalRangeType: normalRange.normalRangeType ?? null,
      rangeFrom: normalRange.rangeFrom,
      rangeTo: normalRange.rangeTo,
      criticalValue: normalRange.criticalValue ?? false,
      criticalValueLessThan: normalRange.criticalValueLessThan,
      criticalValueMoreThan: normalRange.criticalValueMoreThan,
      lovKeys: normalRange.lovKeys ?? []
    };
    try {
      if (normalRange.id) {
        await updateNormalRange({ id: normalRange.id, body }).unwrap();
        setNormalRange({ ...newDiagnosticTestNormalRange, testId: diagnosticsTest.id });
        dispatch(notify({ msg: 'Normal Range Updated', sev: 'success' }));
      } else {
        await createNormalRange(body).unwrap();
        setNormalRange({
          ...newDiagnosticTestNormalRange,
          testId: diagnosticsTest.id,
          profileTestId: profile.id,
          resultType: profile.resultType ?? '',
          normalRangeType: normalRange.normalRangeType
        });
        setNormalRangeFormKey(previous => previous + 1);
        dispatch(notify({ msg: 'Normal Range Created', sev: 'success' }));
      }
    } catch {
      dispatch(notify({ msg: 'Failed to Save Normal Range', sev: 'error' }));
    }
  };

  const removeNormalRange = () => {
    setNormalRangeDeleteOpen(false);
    deleteNormalRange(normalRange.id)
      .unwrap()
      .then(() => {
        setNormalRange({ ...newDiagnosticTestNormalRange });
        dispatch(notify({ msg: 'Deleted Successfully ', sev: 'success' }));
      });
  };

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';
  const profiles = profilesResponse?.data ?? [];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Profiles"
      hideActionBtn
      size="lg"
      bodyheight="75vh"
      content={(
        <div dir={dir}>
          <Form fluid>
            <ProfileSection
              profile={profile}
              setProfile={setProfile}
              profiles={profiles}
              loading={isFetching}
              resultTypes={resultTypes ?? []}
              units={unitsResponse?.object ?? []}
              lovs={lovResponse?.object ?? []}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSave={saveProfile}
              onClear={clearProfileForm}
              onToggleActive={requestProfileToggle}
              onSelect={selectProfile}
              page={pagination.page}
              rowsPerPage={pagination.size}
              totalCount={profilesResponse?.totalCount ?? 0}
              onPageChange={page => setPagination(previous => ({ ...previous, page }))}
              onRowsPerPageChange={size => setPagination(previous => ({ ...previous, page: 0, size }))}
            />
            {profile.id && profile.resultType?.toUpperCase() !== 'TEXT' && (
              <NormalRangeSection
                profile={profile}
                testId={diagnosticsTest?.id}
                normalRange={normalRange}
                setNormalRange={setNormalRange}
                formKey={normalRangeFormKey}
                onSave={saveNormalRange}
                onDelete={removeNormalRange}
                deleteModalOpen={normalRangeDeleteOpen}
                setDeleteModalOpen={setNormalRangeDeleteOpen}
              />
            )}
            <DeletionConfirmationModal
              open={profileConfirmationOpen}
              setOpen={setProfileConfirmationOpen}
              itemToDelete={profile.isActive ? 'Deactivate Profile' : 'Activate Profile'}
              confirmationQuestion={`Are you sure you want to ${profile.isActive ? 'deactivate' : 'activate'} this profile?`}
              actionButtonFunction={toggleActive}
              actionType="Confirm"
            />
          </Form>
        </div>
      )}
    />
  );
};

export default Profile;
