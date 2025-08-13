export function calculateAge(birthday: string | undefined): number {
  if (!birthday) {
    return 0;
  }
  
  const birthDate = new Date(birthday);
  
  // Check if the date is valid
  if (isNaN(birthDate.getTime())) {
    return 0;
  }
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}