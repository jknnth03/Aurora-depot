import * as yup from "yup";

export const createOneUserSchema = yup.object({
  id_prefix: yup.string().required("ID prefix is required."),
  id_no: yup.string().required("ID number is required."),
  first_name: yup.string().required("First name is required."),
  middle_name: yup.string().optional(),
  last_name: yup.string().required("Last name is required."),
  suffix: yup.string().optional(),
  username: yup.string().required("Username is required."),
  password: yup
    .string()
    .required("Password is required.")
    .min(8, "Password must be at least 8 characters."),
});

export const changePasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters.")
    .required("New password is required."),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match.")
    .required("Please confirm the new password."),
});
