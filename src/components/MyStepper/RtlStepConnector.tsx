import { styled } from '@mui/material/styles';
import StepConnector, {
  stepConnectorClasses,
} from '@mui/material/StepConnector';

const RtlStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.root}`]: {
    direction: 'rtl',
  },
  [`& .${stepConnectorClasses.line}`]: {
    marginLeft: 0,
    marginRight: '14px',
  },
}));
export default RtlStepConnector;
