import React, { useEffect } from 'react';
import MyTab from '@/components/MyTab/MyTab';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import SurveySectionsTab from './SurveySectionsTab';
import SurveyTextsTab from './SurveyTextsTab';

/**
 * Setup of the patient satisfaction survey: its sections and their questions,
 * and the texts shown on the survey page.
 */
const SurveyQuestionsSetup = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setPageCode('Survey_Questions_Setup'));
    dispatch(setDivContent('Survey Questions Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <MyTab
      lazy
      data={[
        { title: 'Sections & Questions', content: <SurveySectionsTab /> },
        { title: 'Texts', content: <SurveyTextsTab /> }
      ]}
    />
  );
};

export default SurveyQuestionsSetup;
