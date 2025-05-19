import { toast } from 'sonner';

// Success toasts
export const showSuccessToast = (message: string) => {
  toast.success(message);
};

// Error toasts
export const showErrorToast = (message: string, error?: any) => {
  const errorMessage = error instanceof Error ? error.message : '';
  toast.error(`${message}${errorMessage ? `: ${errorMessage}` : ''}`);
};

// Info toasts
export const showInfoToast = (message: string) => {
  toast.info(message);
};

// Warning toasts
export const showWarningToast = (message: string) => {
  toast.warning(message);
};

// Toast with action
export const showActionToast = (message: string, action: () => void, actionLabel: string) => {
  toast(message, {
    action: {
      label: actionLabel,
      onClick: action,
    },
  });
};

// Toast with progress
export const showProgressToast = (message: string, promise: Promise<any>, successMessage: string, errorMessage: string) => {
  toast.promise(promise, {
    loading: message,
    success: successMessage,
    error: errorMessage,
  });
};

// Custom toasts for common actions
export const toastSnippetCreated = () => showSuccessToast('Snippet created successfully');
export const toastSnippetUpdated = () => showSuccessToast('Snippet updated successfully');
export const toastSnippetDeleted = () => showSuccessToast('Snippet deleted successfully');
export const toastSnippetCopied = () => showSuccessToast('Snippet copied to clipboard');
export const toastFolderCreated = () => showSuccessToast('Folder created successfully');
export const toastFolderDeleted = () => showSuccessToast('Folder deleted successfully'); 