export const ROLES = {
  SUPERADMIN: "superadmin",
  DOCTOR: "doctor",
  PATIENT: "patient"
};

export const ROLE_LIST = Object.values(ROLES);

export const normalizeRole = (role = "") => {
  const map = {
    admin: ROLES.SUPERADMIN,
    super_admin: ROLES.SUPERADMIN,
    superadmin: ROLES.SUPERADMIN,
    practitioner: ROLES.DOCTOR,
    doctor: ROLES.DOCTOR,
    patient: ROLES.PATIENT
  };

  return map[String(role).toLowerCase()] || "";
};
