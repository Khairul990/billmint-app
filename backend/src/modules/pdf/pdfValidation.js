const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validatePdfRequest = (params = {}) => {
  const errors = [];

  if (!params.id || typeof params.id !== 'string' || !UUID_REGEX.test(params.id)) {
    errors.push({ path: 'id', message: 'Valid invoice UUID parameter is required.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    invoiceId: params.id
  };
};
