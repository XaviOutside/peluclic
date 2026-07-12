import { useTranslation } from 'react-i18next';
import Modal from '@/components/atoms/Modal';
import Button from '@/components/atoms/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="mb-6 text-body-md text-on-surface-variant">{message}</p>
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel ?? t('actions.cancel')}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={isLoading}
        >
          {confirmLabel ?? t('actions.confirm')}
        </Button>
      </div>
    </Modal>
  );
}
