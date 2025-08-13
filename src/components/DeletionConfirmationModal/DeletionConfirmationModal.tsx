import React from 'react';
import MyButton from '../MyButton/MyButton';
import { Modal } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';


const actionConfig = {
  delete: {
    text: 'Delete',
    color: 'var(--primary-pink)',
    icon: faTrash
  },
  deactivate: {
    text: 'Deactivate',
    color: 'var(--primary-pink)',
    icon: faTrash
  },
  accept: {
    text: 'Accept',
    color: 'var(--primary-blue)',
    icon: faCircleCheck
  },
  undoaccept: {
    text: 'Undoaccept',
    color: 'var(--primary-pink)',
    icon: faCircleXmark
  },
    reject: {
    text: 'Reject',
    color: 'var(--primary-pink)',
    icon: faCircleXmark
  },
  reactivate: {
    text: 'Reactivate',
    color: 'var(--primary-blue)',
    icon: faArrowRotateLeft
  },
  confirm: {
    text: 'Confirm',
    color: 'var(--primary-blue)',
    icon: faArrowRotateLeft
  }
};

const DeletionConfirmationModal = ({
  open,
  setOpen,
  itemToDelete = '',
  actionButtonFunction = null,
  actionType = 'delete', // delete | deactivate | reactivate | confirm
  confirmationQuestion = '',
  actionButtonLabel = '',
  cancelButtonLabel = 'Cancel'
}) => {
  const config = actionConfig[actionType] || actionConfig.delete;

  const defaultMessage =
    actionType === 'confirm'
      ? 'Are you sure you want to proceed?'
      : `Are you sure you want to ${config.text.toLowerCase()} this ${itemToDelete}?`;

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="30vw" className="delete-modal">
      <Modal.Header>
        <div className="delete-circle-wrapper" style={{ ['--circle-color' as any]: config.color }}>
          <div className="delete-circle-inner" style={{ backgroundColor: config.color }}>
            <FontAwesomeIcon icon={config.icon} />
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="body-delete-modal">
          <span>{confirmationQuestion || defaultMessage}</span>
        </div>
      </Modal.Body>
      <Modal.Footer className="footer-delete-modal">
        <MyButton appearance="subtle" color="var(--dark-blue-gray)" onClick={() => setOpen(false)}>
          {cancelButtonLabel}
        </MyButton>
        <MyButton backgroundColor={config.color} onClick={actionButtonFunction}>
          {actionButtonLabel || config.text}
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default DeletionConfirmationModal;
