import * as yup from "yup";

export const addSchema = yup.object({
  first_name: yup.string().required("First name is required."),
  middle_name: yup.string().optional(),
  last_name: yup.string().required("Last name is required."),
  suffix: yup.string().optional(),
  mobile_number: yup
    .string()
    .required("Mobile number is required.")
    .matches(/^\+63\d{10}$/, "Enter a valid PH mobile number (+63XXXXXXXXXX)."),
  gender: yup
    .string()
    .oneOf(["male", "female"], "Select a valid gender.")
    .required("Gender is required."),
  id_prefix: yup.string().required("ID prefix is required."),
  id_no: yup.string().required("ID number is required."),
  one_charging_id: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? undefined : value,
    )
    .typeError("One Charging is required.")
    .required("One Charging is required."),
  username: yup.string().required("Username is required."),
  role_id: yup
    .number()
    .typeError("Role is required.")
    .required("Role is required."),
});

export const passwordSchema = yup.object({
  old_password: yup.string().required("Old password is required."),
  new_password: yup
    .string()
    .required("New password is required.")
    .min(8, "Password must be at least 8 characters."),
  confirm_password: yup
    .string()
    .required("Please confirm the password.")
    .oneOf([yup.ref("new_password")], "Passwords do not match."),
});
