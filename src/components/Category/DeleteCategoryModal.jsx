import { AlertTriangle } from 'lucide-react';
import {Modal} from '../common/Modal';   // ✅ FIXED
import { Button } from '../common/Button';

export const DeleteCategoryModal = ({
  isOpen,
  onClose,
  category,
  onConfirm,
  loading = false,
}) => {
  if (!category) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Category" size="sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Are you sure?
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          Do you really want to delete the category{" "}
          <strong>"{category.name}"</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-center space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Delete Category
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteCategoryModal;