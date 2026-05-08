export const validateSignup = ({ name, email, firebaseUid }) => {

  if (!name) return "Name is required";

  if (!email) return "Email is required";

  if (!/\S+@\S+\.\S+/.test(email)) {
    return "Invalid email format";
  }

  if (!firebaseUid) {
    return "Firebase UID is required";
  }

  return null;
};