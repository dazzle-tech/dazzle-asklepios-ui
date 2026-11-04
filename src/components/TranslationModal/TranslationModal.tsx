import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import { useAppDispatch } from '@/hooks';
import {
  useAddTranslationMutation,
  useGetAllTranslationsQuery
} from '@/services/setup/translationService';

import { LanguageTranslation } from '@/types/model-types-new';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import { notify } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils';

interface TranslationField {
  fieldName: string;
  value: string;
}

interface TranslationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  fields: TranslationField[];
}

interface Language {
  langKey: string;
  langName: string;
}

interface ExistingTranslation {
  value: string;
  exists: boolean;
}

export const TranslationModal: React.FC<
  TranslationModalProps
> = ({
  open,
  setOpen,
  fields
}) => {
  const dispatch = useAppDispatch();

  // ----------------------------------------
  // Languages
  // ----------------------------------------

  const {
    data: languages,
    isLoading: isLanguagesLoading
  } = useGetAllLanguagesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  // ----------------------------------------
  // Existing translations
  // ----------------------------------------

  const {
    data: allTranslations = [],
    isLoading: isTranslationsLoading
  } = useGetAllTranslationsQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true
  });

  // ----------------------------------------
  // Add translation
  // ----------------------------------------

  const [
    addTranslation,
    addTranslationState
  ] = useAddTranslationMutation();

  // ----------------------------------------
  // User entered translations
  // ----------------------------------------

  const [translations, setTranslations] =
    useState<
      Record<string, Record<string, string>>
    >({});

  // ----------------------------------------
  // Existing translations
  // ----------------------------------------

  const [
    existingTranslations,
    setExistingTranslations
  ] = useState<
    Record<
      string,
      Record<string, ExistingTranslation>
    >
  >({});

  // ----------------------------------------
  // Direction
  // ----------------------------------------

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const dir =
    direction === 'RTL' ? 'rtl' : 'ltr';

  // ----------------------------------------
  // English language
  // ----------------------------------------

  const englishLanguage = useMemo(
    () =>
      languages?.find(
        (language: Language) =>
          language.langKey?.toLowerCase() === 'en'
      ),
    [languages]
  );

  // ----------------------------------------
  // Other languages
  // ----------------------------------------

  const otherLanguages = useMemo(
    () =>
      languages?.filter(
        (language: Language) =>
          language.langKey !==
          englishLanguage?.langKey
      ) ?? [],
    [languages, englishLanguage]
  );

  // ----------------------------------------
  // Generate translation key
  // ----------------------------------------

  const generateKey = (value: string): string => {
    if (!value) return '';

    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  };

  // ----------------------------------------
  // Find existing translations
  // ----------------------------------------

  useEffect(() => {
    if (
      !open ||
      !languages?.length ||
      !fields.length
    ) {
      return;
    }

    const result: Record<
      string,
      Record<string, ExistingTranslation>
    > = {};

    fields.forEach(field => {
      const key = generateKey(field.value);

      result[field.fieldName] = {};

      languages.forEach(
        (language: Language) => {
          const existing =
            (allTranslations as LanguageTranslation[]).find(
              translation =>
                translation.translationKey === key &&
                translation.langKey ===
                  language.langKey
            );

          result[field.fieldName][
            language.langKey
          ] = {
            exists: Boolean(existing),
            value:
              existing?.translationText ?? ''
          };
        }
      );
    });

    setExistingTranslations(result);
  }, [
    open,
    fields,
    languages,
    allTranslations
  ]);

  // ----------------------------------------
  // Initialize editable translations
  // ----------------------------------------

  useEffect(() => {
    if (
      !open ||
      !otherLanguages.length
    ) {
      return;
    }

    const initialValues: Record<
      string,
      Record<string, string>
    > = {};

    fields.forEach(field => {
      initialValues[field.fieldName] = {};

      otherLanguages.forEach(
        (language: Language) => {
          const existing =
            existingTranslations[
              field.fieldName
            ]?.[language.langKey];

          initialValues[field.fieldName][
            language.langKey
          ] =
            existing?.exists
              ? existing.value
              : '';
        }
      );
    });

    setTranslations(initialValues);
  }, [
    open,
    fields,
    otherLanguages,
    existingTranslations
  ]);

  // ----------------------------------------
  // Change translation
  // ----------------------------------------

  const handleTranslationChange = (
    fieldName: string,
    langKey: string,
    value: string
  ) => {
    setTranslations(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [langKey]: value
      }
    }));
  };

  // ----------------------------------------
  // Save
  // ----------------------------------------

  const handleSave = async () => {
    try {
      if (!fields.length) {
        dispatch(
          notify({
            msg: 'No fields to translate.',
            sev: 'warning'
          })
        );

        return;
      }

      if (!languages?.length) {
        dispatch(
          notify({
            msg: 'No languages available',
            sev: 'warning'
          })
        );

        return;
      }

      // --------------------------------------
      // Validate English values
      // --------------------------------------

      for (const field of fields) {
        if (!field.value?.trim()) {
          dispatch(
            notify({
              msg: `${field.fieldName} has no English value`,
              sev: 'warning'
            })
          );

          return;
        }
      }

      const records: LanguageTranslation[] =
        [];

      // --------------------------------------
      // Build records
      // --------------------------------------

      for (const field of fields) {
        const key = generateKey(field.value);

        // ------------------------------------
        // English
        // ------------------------------------

        if (englishLanguage) {
          const englishExisting =
            existingTranslations[
              field.fieldName
            ]?.[englishLanguage.langKey];

          /*
           * English already exists:
           * don't add it again.
           */
          if (!englishExisting?.exists) {
            records.push({
              translationKey: key,
              translationText: field.value,
              langKey:
                englishLanguage.langKey,
              verified: true,
              translated: true
            } as LanguageTranslation);
          }
        }

        // ------------------------------------
        // Other languages
        // ------------------------------------

        for (const language of otherLanguages) {
          const existing =
            existingTranslations[
              field.fieldName
            ]?.[language.langKey];

          /*
           * Translation already exists:
           * don't add it again.
           */
          if (existing?.exists) {
            continue;
          }

          const enteredTranslation =
            translations[
              field.fieldName
            ]?.[language.langKey]?.trim();

          const hasTranslation =
            Boolean(enteredTranslation);

          records.push({
            translationKey: key,

            /*
             * If the user didn't enter a
             * translation, use English value.
             */
            translationText:
              enteredTranslation ||
              field.value,

            langKey: language.langKey,

            verified: false,

            /*
             * Only manually entered translations
             * are marked as translated.
             */
            translated: hasTranslation
          } as LanguageTranslation);
        }
      }

      // --------------------------------------
      // Nothing new to save
      // --------------------------------------

      if (!records.length) {
        dispatch(
          notify({
            msg:
              'All translations already exist.',
            sev: 'warning'
          })
        );

        setOpen(false);

        return;
      }

      // --------------------------------------
      // Save missing translations
      // --------------------------------------

      await Promise.all(
        records.map(record =>
          addTranslation(record).unwrap()
        )
      );

      dispatch(
        notify({
          msg:
            'Translations saved successfully',
          sev: 'success'
        })
      );

      setOpen(false);

    } catch (error) {
      dispatch(
        notify({
          msg:
            extractErrorMessage(error) ||
            'Failed to save translations',
          sev: 'warning'
        })
      );
    }
  };

  // ----------------------------------------
  // Content
  // ----------------------------------------

  const content = (
    <Form fluid dir={dir}>
      {fields.map(field => {
        const key = generateKey(field.value);

        return (
          <div key={field.fieldName}>

            {/* Field Name */}

            <MyInput
              fieldLabel="Field Name"
              fieldName="fieldName"
              fieldType="text"
              record={{
                fieldName: field.fieldName
              }}
              setRecord={() => {}}
              disabled
              width="100%"
            />

            {/* Generated Key */}

            <MyInput
              fieldLabel="Key"
              fieldName="key"
              fieldType="text"
              record={{
                key
              }}
              setRecord={() => {}}
              disabled
              width="100%"
            />

            {/* Original English Value */}

            <MyInput
              fieldLabel="English"
              fieldName="value"
              fieldType="text"
              record={{
                value: field.value
              }}
              setRecord={() => {}}
              disabled
              width="100%"
            />

            {/* Other Languages */}

            {otherLanguages.map(
              (language: Language) => {
                const existing =
                  existingTranslations[
                    field.fieldName
                  ]?.[language.langKey];

                const value =
                  existing?.exists
                    ? existing.value
                    : translations[
                        field.fieldName
                      ]?.[language.langKey] ??
                      '';

                return (
                  <MyInput
                    key={`${field.fieldName}-${language.langKey}`}
                    fieldLabel={
                      language.langName
                    }
                    fieldName="value"
                    fieldType="text"
                    record={{
                      value
                    }}

                    /*
                     * Existing translation:
                     * disabled.
                     *
                     * Missing translation:
                     * editable.
                     */
                    disabled={
                      existing?.exists === true
                    }

                    setRecord={(record: any) =>
                      handleTranslationChange(
                        field.fieldName,
                        language.langKey,
                        record.value
                      )
                    }
                    width="100%"
                  />
                );
              }
            )}
          </div>
        );
      })}
    </Form>
  );

  // ----------------------------------------
  // Modal
  // ----------------------------------------

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Translations"
      size="40vw"
      bodyheight="70vh"
      content={content}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={
        addTranslationState.isLoading ||
        isLanguagesLoading ||
        isTranslationsLoading
      }
    />
  );
};