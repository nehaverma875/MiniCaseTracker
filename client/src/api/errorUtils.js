export const getErrorMessage = (error) => error?.data?.message || error?.error || error?.message || 'Something went wrong';

export const getFieldErrors = (error) => {
  if (error?.data?.fieldErrors) return error.data.fieldErrors;
  if (Array.isArray(error?.data?.errors)) {
    return error.data.errors.reduce((acc, item) => {
      if (item.field && item.message && !acc[item.field]) acc[item.field] = item.message;
      return acc;
    }, {});
  }
  return {};
};
