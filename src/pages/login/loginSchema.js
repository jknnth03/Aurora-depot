import * as yup from "yup";

export const loginSchema = yup.object({
  username: yup.string().required("Username is required."),
  password: yup
    .string()
    .required("Password is required.")
    .min(3, "Password must be at least 3 characters."),
});
