// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Phone validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Number validation
export const isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Positive number validation
export const isPositiveNumber = (value) => {
  return isValidNumber(value) && parseFloat(value) > 0;
};

// Date validation
export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Form validation helper
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = values[field];

    if (rule.required && !isRequired(value)) {
      errors[field] = `${field} is required`;
    } else if (rule.email && !isValidEmail(value)) {
      errors[field] = 'Invalid email address';
    } else if (rule.password && !isValidPassword(value)) {
      errors[field] = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    } else if (rule.phone && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number';
    } else if (rule.number && !isValidNumber(value)) {
      errors[field] = 'Must be a valid number';
    } else if (rule.positive && !isPositiveNumber(value)) {
      errors[field] = 'Must be a positive number';
    } else if (rule.min && parseFloat(value) < rule.min) {
      errors[field] = `Minimum value is ${rule.min}`;
    } else if (rule.max && parseFloat(value) > rule.max) {
      errors[field] = `Maximum value is ${rule.max}`;
    } else if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `Minimum length is ${rule.minLength} characters`;
    } else if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `Maximum length is ${rule.maxLength} characters`;
    }
  });

  return errors;
};