// import React, { useEffect, useState } from 'react';
// import { Form } from 'rsuite';
// import {
//   faHeartbeat,
//   faPills,
//   faSmoking,
//   faWineGlass
// } from '@fortawesome/free-solid-svg-icons';

// import MyInput from '@/components/MyInput';
// import MyModal from '@/components/MyModal/MyModal';
// import CollapsibleSection from '@/components/CollapsibleSection/CollapsibleSection';
// import Translate from '@/components/Translate';

// import { useGetLovValuesByCodeQuery } from '@/services/setupService';

// import {
//   useUpdateClaimEncounterCopySocialHistoryMutation
// } from '@/services/billing/claimEncounterCopySocialHistoryService';

// import { useAppDispatch } from '@/hooks';
// import { notify } from '@/utils/uiReducerActions';

// const EditClaimEncounterCopySocialHistoryModal = ({
//   open,
//   setOpen,
//   initialData
// }) => {
//   const dispatch = useAppDispatch();

//   const [record, setRecord] = useState<any>({});

//   const [smokingExpanded, setSmokingExpanded] = useState(true);
//   const [alcoholExpanded, setAlcoholExpanded] = useState(false);
//   const [substanceExpanded, setSubstanceExpanded] = useState(false);
//   const [healthExpanded, setHealthExpanded] = useState(false);

//   const { data: routeLov } =
//     useGetLovValuesByCodeQuery('MED_ROA');

//   const { data: freqLov } =
//     useGetLovValuesByCodeQuery('FREQUENT_USE');

//   const { data: physicalLov } =
//     useGetLovValuesByCodeQuery('PHYSICAL_LIMITATION');

//   const { data: diagnoseLov } =
//     useGetLovValuesByCodeQuery('EATING_DISORDERS');

//   const [
//     updateSocialHistory,
//     { isLoading }
//   ] = useUpdateClaimEncounterCopySocialHistoryMutation();

//   useEffect(() => {
//     if (!open || !initialData) {
//       return;
//     }

//     setRecord({
//       ...initialData,
//       isCurrentSmoker:
//         initialData.isCurrentSmoker ?? false,
//       isPreviousSmoker:
//         initialData.isPreviousSmoker ?? false,
//       exposureToSecondHandSmoke:
//         initialData.exposureToSecondHandSmoke ?? false,
//       alcoholConsumption:
//         initialData.alcoholConsumption ?? false,
//       substanceUse:
//         initialData.substanceUse ?? false,
//       patientIsFree:
//         initialData.patientIsFree ?? false,
//       smokeStartDate:
//         initialData.smokeStartDate
//           ? new Date(initialData.smokeStartDate)
//           : null,
//       smokeQuitDate:
//         initialData.smokeQuitDate
//           ? new Date(initialData.smokeQuitDate)
//           : null,
//       alcoholSinceWhen:
//         initialData.alcoholSinceWhen
//           ? new Date(initialData.alcoholSinceWhen)
//           : null
//     });
//   }, [open, initialData]);

//   const toNoonTimestamp = (value: any) => {
//     if (!value) {
//       return null;
//     }

//     const date =
//       value instanceof Date
//         ? new Date(value)
//         : new Date(value);

//     if (Number.isNaN(date.getTime())) {
//       return null;
//     }

//     date.setHours(12, 0, 0, 0);

//     return date.getTime();
//   };

//   const validateBeforeSave = () => {
//     const errors: string[] = [];

//     const today = new Date();
//     today.setHours(23, 59, 59, 999);

//     if (
//       record.isCurrentSmoker &&
//       record.isPreviousSmoker
//     ) {
//       errors.push(
//         'Cannot be both a current and previous smoker.'
//       );
//     }

//     if (record.isCurrentSmoker) {
//       if (!record.smokeStartDate) {
//         errors.push(
//           'Smoke start date is required for current smokers.'
//         );
//       } else if (
//         new Date(record.smokeStartDate) > today
//       ) {
//         errors.push(
//           'Smoke start date cannot be in the future.'
//         );
//       }

//       if (
//         !record.cigaretteAmount ||
//         record.cigaretteAmount <= 0
//       ) {
//         errors.push(
//           'Cigarette amount is required and must be greater than 0.'
//         );
//       }
//     }

//     if (record.isPreviousSmoker) {
//       if (!record.smokeQuitDate) {
//         errors.push(
//           'Smoke quit date is required for previous smokers.'
//         );
//       } else if (
//         new Date(record.smokeQuitDate) > today
//       ) {
//         errors.push(
//           'Smoke quit date cannot be in the future.'
//         );
//       }
//     }

//     if (record.alcoholConsumption) {
//       if (!record.alcoholSinceWhen) {
//         errors.push(
//           '"Since when" date is required when alcohol consumption is enabled.'
//         );
//       } else if (
//         new Date(record.alcoholSinceWhen) > today
//       ) {
//         errors.push(
//           'Alcohol since-when date cannot be in the future.'
//         );
//       }
//     }

//     return errors;
//   };

//   const handleSave = async () => {
//     const errors = validateBeforeSave();

//     if (errors.length) {
//       dispatch(
//         notify({
//           msg: errors.join('\n'),
//           sev: 'warning'
//         })
//       );

//       return;
//     }

//     try {
//       await updateSocialHistory({
//         id: record.id,

//         isCurrentSmoker:
//           record.isCurrentSmoker ?? false,

//         smokeStartDate:
//           record.isCurrentSmoker &&
//           record.smokeStartDate
//             ? new Date(
//                 toNoonTimestamp(record.smokeStartDate)
//               ).toISOString()
//             : null,

//         cigaretteAmount:
//           record.isCurrentSmoker
//             ? record.cigaretteAmount ?? null
//             : null,

//         cigaretteType:
//           record.isCurrentSmoker
//             ? record.cigaretteType?.trim() || null
//             : null,

//         isPreviousSmoker:
//           record.isPreviousSmoker ?? false,

//         smokeQuitDate:
//           record.isPreviousSmoker &&
//           record.smokeQuitDate
//             ? new Date(
//                 toNoonTimestamp(record.smokeQuitDate)
//               ).toISOString()
//             : null,

//         exposureToSecondHandSmoke:
//           record.exposureToSecondHandSmoke ?? false,

//         alcoholConsumption:
//           record.alcoholConsumption ?? false,

//         typeOfAlcohol:
//           record.alcoholConsumption
//             ? record.typeOfAlcohol?.trim() || null
//             : null,

//         alcoholSinceWhen:
//           record.alcoholConsumption &&
//           record.alcoholSinceWhen
//             ? new Date(
//                 toNoonTimestamp(
//                   record.alcoholSinceWhen
//                 )
//               ).toISOString()
//             : null,

//         substanceUse:
//           record.substanceUse ?? false,

//         route:
//           record.substanceUse
//             ? record.route || null
//             : null,

//         frequency:
//           record.substanceUse
//             ? record.frequency || null
//             : null,

//         physicalLimitation:
//           record.physicalLimitation || null,

//         diagnosedEatingDisorders:
//           record.diagnosedEatingDisorders || null,

//         patientIsFree:
//           record.patientIsFree ?? false,

//         freeText:
//           record.patientIsFree
//             ? record.freeText?.trim() || null
//             : null
//       }).unwrap();

//       dispatch(
//         notify({
//           msg: 'Social history updated successfully.',
//           sev: 'success'
//         })
//       );

//       setOpen(false);
//     } catch (error: any) {
//       dispatch(
//         notify({
//           msg:
//             error?.data?.message ||
//             error?.data?.detail ||
//             'Failed to update Social History.',
//           sev: 'warning'
//         })
//       );
//     }
//   };

//   const content = (
//     <div className="padding-8">
//       <CollapsibleSection
//         title={<Translate>Smoking History</Translate>}
//         icon={faSmoking}
//         color="var(--primary-blue)"
//         isOpen={smokingExpanded}
//         onToggle={() =>
//           setSmokingExpanded(previous => !previous)
//         }
//         badge={
//           record?.isCurrentSmoker
//             ? 'Active'
//             : record?.isPreviousSmoker
//               ? 'Former'
//               : null
//         }
//       >
//         <Form
//           fluid
//           layout="inline"
//           className="fields-container"
//         >
//           <div className="full-row">
//             <MyInput
//               width="100%"
//               column
//               fieldType="checkbox"
//               fieldLabel="Current Smoker"
//               fieldName="isCurrentSmoker"
//               record={record}
//               setRecord={setRecord}
//               disabled={record?.isPreviousSmoker}
//             />
//           </div>

//           {record?.isCurrentSmoker && (
//             <>
//               <MyInput
//                 width="100%"
//                 column
//                 required
//                 fieldType="date"
//                 fieldLabel="Start date"
//                 fieldName="smokeStartDate"
//                 disableFutureDates
//                 record={record}
//                 setRecord={setRecord}
//               />

//               <MyInput
//                 width="100%"
//                 column
//                 required
//                 fieldType="number"
//                 fieldLabel="Amount"
//                 fieldName="cigaretteAmount"
//                 record={record}
//                 setRecord={setRecord}
//                 rightAddon="pack/day"
//                 rightAddonwidth={80}
//               />

//               <MyInput
//                 width="100%"
//                 column
//                 fieldLabel="Cigarette Type"
//                 fieldName="cigaretteType"
//                 record={record}
//                 setRecord={setRecord}
//               />
//             </>
//           )}

//           <div className="full-row">
//             <MyInput
//               width="100%"
//               column
//               fieldType="checkbox"
//               fieldLabel="Previous Smoker"
//               fieldName="isPreviousSmoker"
//               record={record}
//               setRecord={setRecord}
//               disabled={record?.isCurrentSmoker}
//             />
//           </div>

//           {record?.isPreviousSmoker && (
//             <div className="full-row">
//               <MyInput
//                 width="100%"
//                 column
//                 required
//                 fieldType="date"
//                 fieldLabel="Quit date"
//                 fieldName="smokeQuitDate"
//                 disableFutureDates
//                 record={record}
//                 setRecord={setRecord}
//               />
//             </div>
//           )}

//           <MyInput
//             width="100%"
//             column
//             fieldType="checkbox"
//             fieldLabel="Exposure to second-hand smoke"
//             fieldName="exposureToSecondHandSmoke"
//             record={record}
//             setRecord={setRecord}
//           />
//         </Form>
//       </CollapsibleSection>

//       <CollapsibleSection
//         title={<Translate>Alcohol Consumption</Translate>}
//         icon={faWineGlass}
//         color="var(--primary-blue)"
//         isOpen={alcoholExpanded}
//         onToggle={() =>
//           setAlcoholExpanded(previous => !previous)
//         }
//         badge={record?.alcoholConsumption ? 'Active' : null}
//       >
//         <Form
//           fluid
//           layout="inline"
//           className="fields-container"
//         >
//           <div className="full-row">
//             <MyInput
//               width="100%"
//               column
//               fieldType="checkbox"
//               fieldLabel="Alcohol Consumption"
//               fieldName="alcoholConsumption"
//               record={record}
//               setRecord={setRecord}
//             />
//           </div>

//           {record?.alcoholConsumption && (
//             <>
//               <MyInput
//                 width="100%"
//                 column
//                 required
//                 fieldType="date"
//                 fieldLabel="Since when"
//                 fieldName="alcoholSinceWhen"
//                 disableFutureDates
//                 record={record}
//                 setRecord={setRecord}
//               />

//               <MyInput
//                 width="100%"
//                 column
//                 fieldLabel="Type of alcohol"
//                 fieldName="typeOfAlcohol"
//                 record={record}
//                 setRecord={setRecord}
//               />
//             </>
//           )}
//         </Form>
//       </CollapsibleSection>

//       <CollapsibleSection
//         title={<Translate>Substance Use</Translate>}
//         icon={faPills}
//         color="#415be7"
//         isOpen={substanceExpanded}
//         onToggle={() =>
//           setSubstanceExpanded(previous => !previous)
//         }
//         badge={record?.substanceUse ? 'Active' : null}
//       >
//         <Form
//           fluid
//           layout="inline"
//           className="fields-container"
//         >
//           <div className="full-row">
//             <MyInput
//               width="100%"
//               column
//               fieldType="checkbox"
//               fieldLabel={<Translate>Substance Use</Translate>}
//               fieldName="substanceUse"
//               record={record}
//               setRecord={setRecord}
//             />
//           </div>

//           {record?.substanceUse && (
//             <>
//               <MyInput
//                 width="15vw"
//                 column
//                 fieldLabel="Route"
//                 fieldName="route"
//                 fieldType="select"
//                 selectData={routeLov?.object ?? []}
//                 selectDataLabel="lovDisplayVale"
//                 disableByField="isValid"
//                 selectDataValue="key"
//                 record={record}
//                 setRecord={setRecord}
//               />

//               <MyInput
//                 width="15vw"
//                 column
//                 fieldLabel="Frequency"
//                 fieldName="frequency"
//                 fieldType="select"
//                 selectData={freqLov?.object ?? []}
//                 selectDataLabel="lovDisplayVale"
//                 disableByField="isValid"
//                 selectDataValue="key"
//                 record={record}
//                 setRecord={setRecord}
//                 searchable={false}
//               />
//             </>
//           )}
//         </Form>
//       </CollapsibleSection>

//       <CollapsibleSection
//         title={<Translate>Health Conditions</Translate>}
//         icon={faHeartbeat}
//         color="var(--primary-blue)"
//         isOpen={healthExpanded}
//         onToggle={() =>
//           setHealthExpanded(previous => !previous)
//         }
//       >
//         <Form
//           fluid
//           layout="inline"
//           className="fields-container"
//         >
//           <MyInput
//             width="15vw"
//             column
//             fieldLabel="Physical limitations"
//             fieldName="physicalLimitation"
//             fieldType="select"
//             selectData={physicalLov?.object ?? []}
//             selectDataLabel="lovDisplayVale"
//             disableByField="isValid"
//             selectDataValue="key"
//             record={record}
//             setRecord={setRecord}
//             searchable={false}
//           />

//           <MyInput
//             width="15vw"
//             column
//             fieldLabel="Diagnosed eating disorders"
//             fieldName="diagnosedEatingDisorders"
//             fieldType="select"
//             selectData={diagnoseLov?.object ?? []}
//             selectDataLabel="lovDisplayVale"
//             disableByField="isValid"
//             selectDataValue="key"
//             record={record}
//             setRecord={setRecord}
//             searchable={false}
//           />
//         </Form>
//       </CollapsibleSection>

//       <CollapsibleSection
//         title="Patient Status"
//         icon={faHeartbeat}
//         color="var(--primary-blue)"
//         isOpen
//         onToggle={() => {}}
//       >
//         <Form
//           fluid
//           layout="inline"
//           className="fields-container"
//         >
//           <div className="full-row">
//             <MyInput
//               width="100%"
//               column
//               fieldType="checkbox"
//               fieldLabel="Patient Is Free"
//               fieldName="patientIsFree"
//               record={record}
//               setRecord={setRecord}
//             />
//           </div>

//           {record?.patientIsFree && (
//             <MyInput
//               width="100%"
//               column
//               fieldType="textarea"
//               fieldLabel="Free Text"
//               fieldName="freeText"
//               record={record}
//               setRecord={setRecord}
//             />
//           )}
//         </Form>
//       </CollapsibleSection>
//     </div>
//   );

//   const direction =
//     localStorage.getItem('direction') || 'LTR';

//   const dir = direction === 'RTL' ? 'rtl' : 'ltr';

//   return (
//     <MyModal
//       open={open}
//       setOpen={setOpen}
//       title="Edit Social History"
    
//       actionButtonFunction={handleSave}
//       position="right"
//       size="38vw"
//       content={
//         <div dir={dir}>
//           {content}
//         </div>
//       }
//     />
//   );
// };

// export default EditClaimEncounterCopySocialHistoryModal;
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import {
  faHeartbeat,
  faPills,
  faSmoking,
  faWineGlass
} from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import CollapsibleSection from '@/components/CollapsibleSection/CollapsibleSection';
import Translate from '@/components/Translate';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import {
  useCreateClaimEncounterCopySocialHistoryMutation,
  useUpdateClaimEncounterCopySocialHistoryMutation
} from '@/services/billing/claimEncounterCopySocialHistoryService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const EditClaimEncounterCopySocialHistoryModal = ({
  open,
  setOpen,
  initialData,
  claimEncounterCopyId
}) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<any>({});

  const [smokingExpanded, setSmokingExpanded] = useState(true);
  const [alcoholExpanded, setAlcoholExpanded] = useState(false);
  const [substanceExpanded, setSubstanceExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);

  const { data: routeLov } =
    useGetLovValuesByCodeQuery('MED_ROA');

  const { data: freqLov } =
    useGetLovValuesByCodeQuery('FREQUENT_USE');

  const { data: physicalLov } =
    useGetLovValuesByCodeQuery('PHYSICAL_LIMITATION');

  const { data: diagnoseLov } =
    useGetLovValuesByCodeQuery('EATING_DISORDERS');

  const [
    updateSocialHistory,
    { isLoading: isUpdating }
  ] = useUpdateClaimEncounterCopySocialHistoryMutation();

  const [
    createSocialHistory,
    { isLoading: isCreating }
  ] = useCreateClaimEncounterCopySocialHistoryMutation();

  const isAddMode = !initialData;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialData) {
      setRecord({
        ...initialData,
        isCurrentSmoker:
          initialData.isCurrentSmoker ?? false,
        isPreviousSmoker:
          initialData.isPreviousSmoker ?? false,
        exposureToSecondHandSmoke:
          initialData.exposureToSecondHandSmoke ?? false,
        alcoholConsumption:
          initialData.alcoholConsumption ?? false,
        substanceUse:
          initialData.substanceUse ?? false,
        patientIsFree:
          initialData.patientIsFree ?? false,
        smokeStartDate:
          initialData.smokeStartDate
            ? new Date(initialData.smokeStartDate)
            : null,
        smokeQuitDate:
          initialData.smokeQuitDate
            ? new Date(initialData.smokeQuitDate)
            : null,
        alcoholSinceWhen:
          initialData.alcoholSinceWhen
            ? new Date(initialData.alcoholSinceWhen)
            : null
      });

      return;
    }

    setRecord({
      isCurrentSmoker: false,
      smokeStartDate: null,
      cigaretteAmount: null,
      cigaretteType: '',
      isPreviousSmoker: false,
      smokeQuitDate: null,
      exposureToSecondHandSmoke: false,
      alcoholConsumption: false,
      typeOfAlcohol: '',
      alcoholSinceWhen: null,
      substanceUse: false,
      route: '',
      frequency: '',
      physicalLimitation: '',
      diagnosedEatingDisorders: '',
      patientIsFree: false,
      freeText: ''
    });
  }, [open, initialData]);

  const toNoonTimestamp = (value: any) => {
    if (!value) {
      return null;
    }

    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    date.setHours(12, 0, 0, 0);

    return date.getTime();
  };

  const validateBeforeSave = () => {
    const errors: string[] = [];

    if (record.patientIsFree) {
      if (!record.freeText?.trim()) {
        errors.push('Free Text is required.');
      }

      return errors;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (
      record.isCurrentSmoker &&
      record.isPreviousSmoker
    ) {
      errors.push(
        'Cannot be both a current and previous smoker.'
      );
    }

    if (record.isCurrentSmoker) {
      if (!record.smokeStartDate) {
        errors.push(
          'Smoke start date is required for current smokers.'
        );
      } else if (
        new Date(record.smokeStartDate) > today
      ) {
        errors.push(
          'Smoke start date cannot be in the future.'
        );
      }

      if (
        !record.cigaretteAmount ||
        record.cigaretteAmount <= 0
      ) {
        errors.push(
          'Cigarette amount is required and must be greater than 0.'
        );
      }
    }

    if (record.isPreviousSmoker) {
      if (!record.smokeQuitDate) {
        errors.push(
          'Smoke quit date is required for previous smokers.'
        );
      } else if (
        new Date(record.smokeQuitDate) > today
      ) {
        errors.push(
          'Smoke quit date cannot be in the future.'
        );
      }
    }

    if (record.alcoholConsumption) {
      if (!record.alcoholSinceWhen) {
        errors.push(
          '"Since when" date is required when alcohol consumption is enabled.'
        );
      } else if (
        new Date(record.alcoholSinceWhen) > today
      ) {
        errors.push(
          'Alcohol since-when date cannot be in the future.'
        );
      }
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateBeforeSave();

    if (errors.length) {
      dispatch(
        notify({
          msg: errors.join('\n'),
          sev: 'warning'
        })
      );

      return;
    }

    if (isAddMode && !claimEncounterCopyId) {
      dispatch(
        notify({
          msg: 'Claim encounter copy is required.',
          sev: 'warning'
        })
      );

      return;
    }

    const isFree = record.patientIsFree === true;

    const payload = {
      isCurrentSmoker:
        isFree ? false : record.isCurrentSmoker ?? false,

      smokeStartDate:
        !isFree &&
        record.isCurrentSmoker &&
        record.smokeStartDate
          ? new Date(
              toNoonTimestamp(record.smokeStartDate)
            ).toISOString()
          : null,

      cigaretteAmount:
        !isFree && record.isCurrentSmoker
          ? record.cigaretteAmount ?? null
          : null,

      cigaretteType:
        !isFree && record.isCurrentSmoker
          ? record.cigaretteType?.trim() || null
          : null,

      isPreviousSmoker:
        isFree ? false : record.isPreviousSmoker ?? false,

      smokeQuitDate:
        !isFree &&
        record.isPreviousSmoker &&
        record.smokeQuitDate
          ? new Date(
              toNoonTimestamp(record.smokeQuitDate)
            ).toISOString()
          : null,

      exposureToSecondHandSmoke:
        isFree ? false : record.exposureToSecondHandSmoke ?? false,

      alcoholConsumption:
        isFree ? false : record.alcoholConsumption ?? false,

      typeOfAlcohol:
        !isFree && record.alcoholConsumption
          ? record.typeOfAlcohol?.trim() || null
          : null,

      alcoholSinceWhen:
        !isFree &&
        record.alcoholConsumption &&
        record.alcoholSinceWhen
          ? new Date(
              toNoonTimestamp(
                record.alcoholSinceWhen
              )
            ).toISOString()
          : null,

      substanceUse:
        isFree ? false : record.substanceUse ?? false,

      route:
        !isFree && record.substanceUse
          ? record.route || null
          : null,

      frequency:
        !isFree && record.substanceUse
          ? record.frequency || null
          : null,

      physicalLimitation:
        isFree ? null : record.physicalLimitation || null,

      diagnosedEatingDisorders:
        isFree ? null : record.diagnosedEatingDisorders || null,

      patientIsFree: isFree,

      freeText:
        isFree
          ? record.freeText?.trim() || null
          : null
    };

    try {
      if (isAddMode) {
        await createSocialHistory({
          claimEncounterCopyId,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Social history added successfully.',
            sev: 'success'
          })
        );
      } else {
        await updateSocialHistory({
          id: record.id,
          ...payload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Social history updated successfully.',
            sev: 'success'
          })
        );
      }

      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ||
            error?.data?.detail ||
            (
              isAddMode
                ? 'Failed to add Social History.'
                : 'Failed to update Social History.'
            ),
          sev: 'warning'
        })
      );
    }
  };

  const content = (
    <div className="padding-8">
      <CollapsibleSection
        title={<Translate>Smoking History</Translate>}
        icon={faSmoking}
        color="var(--primary-blue)"
        isOpen={smokingExpanded}
        onToggle={() =>
          setSmokingExpanded(previous => !previous)
        }
        badge={
          record?.isCurrentSmoker
            ? 'Active'
            : record?.isPreviousSmoker
              ? 'Former'
              : null
        }
      >
        <Form
          fluid
          layout="inline"
          className="fields-container"
        >
          <div className="full-row">
            <MyInput
              width="100%"
              column
              fieldType="checkbox"
              fieldLabel="Current Smoker"
              fieldName="isCurrentSmoker"
              record={record}
              setRecord={setRecord}
              disabled={record?.patientIsFree || record?.isPreviousSmoker}
            />
          </div>

          {record?.isCurrentSmoker && (
            <>
              <MyInput
                width="100%"
                column
                required={!record?.patientIsFree}
                fieldType="date"
                fieldLabel="Start date"
                fieldName="smokeStartDate"
                disableFutureDates
                record={record}
                setRecord={setRecord}
                disabled={record?.patientIsFree}
              />

              <MyInput
                width="100%"
                column
                required={!record?.patientIsFree}
                fieldType="number"
                fieldLabel="Amount"
                fieldName="cigaretteAmount"
                record={record}
                setRecord={setRecord}
                rightAddon="pack/day"
                rightAddonwidth={80}
                disabled={record?.patientIsFree}
              />

              <MyInput
                width="100%"
                column
                fieldLabel="Cigarette Type"
                fieldName="cigaretteType"
                record={record}
                setRecord={setRecord}
                disabled={record?.patientIsFree}
              />
            </>
          )}

          <div className="full-row">
            <MyInput
              width="100%"
              column
              fieldType="checkbox"
              fieldLabel="Previous Smoker"
              fieldName="isPreviousSmoker"
              record={record}
              setRecord={setRecord}
              disabled={record?.patientIsFree || record?.isCurrentSmoker}
            />
          </div>

          {record?.isPreviousSmoker && (
            <div className="full-row">
              <MyInput
                width="100%"
                column
                required={!record?.patientIsFree}
                fieldType="date"
                fieldLabel="Quit date"
                fieldName="smokeQuitDate"
                disableFutureDates
                record={record}
                setRecord={setRecord}
                disabled={record?.patientIsFree}
              />
            </div>
          )}

          <MyInput
            width="100%"
            column
            fieldType="checkbox"
            fieldLabel="Exposure to second-hand smoke"
            fieldName="exposureToSecondHandSmoke"
            record={record}
            setRecord={setRecord}
            disabled={record?.patientIsFree}
          />
        </Form>
      </CollapsibleSection>

      <CollapsibleSection
        title={<Translate>Alcohol Consumption</Translate>}
        icon={faWineGlass}
        color="var(--primary-blue)"
        isOpen={alcoholExpanded}
        onToggle={() =>
          setAlcoholExpanded(previous => !previous)
        }
        badge={record?.alcoholConsumption ? 'Active' : null}
      >
        <Form
          fluid
          layout="inline"
          className="fields-container"
        >
          <div className="full-row">
            <MyInput
              width="100%"
              column
              fieldType="checkbox"
              fieldLabel="Alcohol Consumption"
              fieldName="alcoholConsumption"
              record={record}
              setRecord={setRecord}
              disabled={record?.patientIsFree}
            />
          </div>

          {record?.alcoholConsumption && (
            <>
              <MyInput
                width="100%"
                column
                required={!record?.patientIsFree}
                fieldType="date"
                fieldLabel="Since when"
                fieldName="alcoholSinceWhen"
                disableFutureDates
                record={record}
                setRecord={setRecord}
                disabled={record?.patientIsFree}
              />

              <MyInput
                width="100%"
                column
                fieldLabel="Type of alcohol"
                fieldName="typeOfAlcohol"
                record={record}
                setRecord={setRecord}
                disabled={record?.patientIsFree}
              />
            </>
          )}
        </Form>
      </CollapsibleSection>

      <CollapsibleSection
        title={<Translate>Substance Use</Translate>}
        icon={faPills}
        color="#415be7"
        isOpen={substanceExpanded}
        onToggle={() =>
          setSubstanceExpanded(previous => !previous)
        }
        badge={record?.substanceUse ? 'Active' : null}
      >
        <Form
          fluid
          layout="inline"
          className="fields-container"
        >
          <div className="full-row">
            <MyInput
              width="100%"
              column
              fieldType="checkbox"
              fieldLabel={<Translate>Substance Use</Translate>}
              fieldName="substanceUse"
              record={record}
              setRecord={setRecord}
              disabled={record?.patientIsFree}
            />
          </div>

          {record?.substanceUse && (
            <>
              <MyInput
                width="15vw"
                column
                fieldLabel="Route"
                fieldName="route"
                fieldType="select"
                selectData={routeLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                disableByField="isValid"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
                disabled={record?.patientIsFree}
              />

              <MyInput
                width="15vw"
                column
                fieldLabel="Frequency"
                fieldName="frequency"
                fieldType="select"
                selectData={freqLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                disableByField="isValid"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
                searchable={false}
                disabled={record?.patientIsFree}
              />
            </>
          )}
        </Form>
      </CollapsibleSection>

      <CollapsibleSection
        title={<Translate>Health Conditions</Translate>}
        icon={faHeartbeat}
        color="var(--primary-blue)"
        isOpen={healthExpanded}
        onToggle={() =>
          setHealthExpanded(previous => !previous)
        }
      >
        <Form
          fluid
          layout="inline"
          className="fields-container"
        >
          <MyInput
            width="15vw"
            column
            fieldLabel="Physical limitations"
            fieldName="physicalLimitation"
            fieldType="select"
            selectData={physicalLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            disableByField="isValid"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            searchable={false}
            disabled={record?.patientIsFree}
          />

          <MyInput
            width="15vw"
            column
            fieldLabel="Diagnosed eating disorders"
            fieldName="diagnosedEatingDisorders"
            fieldType="select"
            selectData={diagnoseLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            disableByField="isValid"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            searchable={false}
            disabled={record?.patientIsFree}
          />
        </Form>
      </CollapsibleSection>

      <CollapsibleSection
        title="Patient Status"
        icon={faHeartbeat}
        color="var(--primary-blue)"
        isOpen
        onToggle={() => {}}
      >
        <Form
          fluid
          layout="inline"
          className="fields-container"
        >
          <div className="full-row">
            <MyInput
              width="100%"
              column
              fieldType="checkbox"
              fieldLabel="Patient Is Free"
              fieldName="patientIsFree"
              record={record}
              setRecord={setRecord}
            />
          </div>

          <MyInput
            width="100%"
            column
            fieldType="textarea"
            fieldLabel="Free Text"
            fieldName="freeText"
            record={record}
            setRecord={setRecord}
            required={record?.patientIsFree}
            disabled={!record?.patientIsFree}
          />
        </Form>
      </CollapsibleSection>
    </div>
  );

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        isAddMode
          ? 'Add Social History'
          : 'Edit Social History'
      }
      actionButtonFunction={handleSave}
      position="right"
      size="38vw"
      content={
        <div dir={dir}>
          {content}
        </div>
      }
      loading={isUpdating || isCreating}
    />
  );
};

export default EditClaimEncounterCopySocialHistoryModal;