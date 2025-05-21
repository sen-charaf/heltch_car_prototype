// Function to Get All Doctors
export const getUserId = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/user_id=([^;]+)/);
  return match ? match[1] : null;
};