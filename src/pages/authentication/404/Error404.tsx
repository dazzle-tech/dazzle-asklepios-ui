import React from 'react';
import ErrorPage from '@/components/ErrorPage';
import { IconButton } from 'rsuite';
import ArrowLeftLine from '@rsuite/icons/ArrowLeftLine';
import MyButton from '@/components/MyButton/MyButton';
import { useNavigate } from 'react-router-dom';
const ErrorNotFoundPage = () => {
  const navigate = useNavigate();
  return(
  <ErrorPage code={404}>
    <p className="error-page-title">Oops… You just found an error page</p>
    <p className="error-page-subtitle text-muted ">
      We are sorry but the page you are looking for was not found
    </p>
    <MyButton prefixIcon={() =><ArrowLeftLine />} appearance="primary" onClick={() => navigate('/')}>
      Take me home
    </MyButton>
  </ErrorPage>
  )
}
export default ErrorNotFoundPage;
