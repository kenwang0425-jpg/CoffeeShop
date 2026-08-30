function validatePasswordComplexity(password) {
  if (!password || password.length < 8) return false;
  let typesCount = 0;
  if (/[A-Z]/.test(password)) typesCount++;
  if (/[a-z]/.test(password)) typesCount++;
  if (/[0-9]/.test(password)) typesCount++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) typesCount++;
  return typesCount >= 3;
}

module.exports = {
  validatePasswordComplexity
};
