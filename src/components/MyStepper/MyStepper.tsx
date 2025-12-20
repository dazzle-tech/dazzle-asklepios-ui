import React from 'react';
import Check from '@mui/icons-material/Check';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import {
  Box,
  Step,
  StepLabel,
  Stepper,
  Typography,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Text } from 'rsuite';
import './styles.less';

type OrientationType = 'horizontal' | 'vertical';

interface MyStepperProps {
  activeStep: number;
  stepsList: any[];
  orientation?: OrientationType;
  modalColor?: string;
}

const MyStepper: React.FC<MyStepperProps> = ({
  activeStep,
  stepsList,
  orientation = 'horizontal',
  modalColor = 'var(--primary-blue)',
}) => {
  /* =========================
     Custom Step Icon
  ========================= */
  const CustomStepIcon = (props: any) => {
    const { active, completed, error, icon, iconsMap } = props;
    const stepData = iconsMap[icon];
    const customIcon = stepData?.customIcon;

    const backgroundColor = error
      ? 'error.main'
      : completed
      ? '#45B887'
      : active
      ? modalColor
      : '#fff';

    const iconColor = error || completed || active ? '#fff' : '#888';

    return (
      <Box
        sx={{
          border: `2px dashed ${modalColor}`,
          padding: '4px',
          borderRadius: '50%',
          display: 'inline-flex',
        }}
      >
        <Box
          sx={{
            width: { xs: 32, sm: 32, md: 34, lg: 38, xl: 40 },
            height: { xs: 32, sm: 32, md: 34, lg: 38, xl: 40 },
            borderRadius: '50%',
            backgroundColor,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: !active && !completed && !error ? '1px solid #ccc' : 'none',
          }}
        >
          {error ? (
            <ReportProblemIcon fontSize="small" />
          ) : completed ? (
            <Check fontSize="small" />
          ) : customIcon ? (
            customIcon
          ) : (
            icon
          )}
        </Box>
      </Box>
    );
  };

  /* =========================
     Connectors
  ========================= */
  const VerticalConnector = styled(StepConnector)(() => ({
    [`& .${stepConnectorClasses.line}`]: {
      borderLeftWidth: 3,
      minHeight: 24,
      marginLeft: 20,
      borderColor: '#D9D9D9',
    },
  }));

  const HorizontalConnector = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
      top: 16,
    },
    [`& .${stepConnectorClasses.line}`]: {
      borderTopWidth: 3,
      borderColor: '#D9D9D9',
      borderRadius: 1,
      marginLeft: 4,
      marginRight: 4,
    },
  }));

  const connector =
    orientation === 'vertical' ? <VerticalConnector /> : <HorizontalConnector />;

  /* =========================
     Icons Map
  ========================= */
  const iconsMap = stepsList.reduce((acc, step, index) => {
    acc[index + 1] = step;
    return acc;
  }, {} as Record<number, any>);

  /* =========================
     Render
  ========================= */
  return (
    <Stepper
      activeStep={activeStep}
      orientation={orientation}
      alternativeLabel={orientation === 'horizontal'}
      connector={connector}
      sx={{
        px: { xs: 1, sm: 2 },
        overflowX: 'auto',
      }}
    >
      {stepsList.map((step, index) => (
        <Step key={step.key}>
          <StepLabel
            error={step.isError}
            StepIconComponent={(props) => (
              <CustomStepIcon
                {...props}
                iconsMap={iconsMap}
                modalColor={modalColor}
              />
            )}
            optional={
              step.description && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: '10px', sm: '12px' },
                    textAlign: 'center',
                  }}
                >
                  {step.description}
                </Typography>
              )
            }
            sx={{
              '.MuiStepLabel-label': {
                fontSize: { xs: '11px', sm: '13px', md: '14px' },
                textAlign: 'center',
                whiteSpace: 'normal',
                lineHeight: 1.3,
              },
            }}
          >
            <Text className="text-value">{step.value}</Text>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default MyStepper;
