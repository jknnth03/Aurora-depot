import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AuroraIcon from "../../assets/aurora.svg";
import MisLogo from "../../assets/mis.png";
import "./Login.scss";
import { setCredentials } from "../../app/authSlice";
import { loginSchema } from "./loginSchema";
import { useLoginMutation } from "../../features/api/login/loginApi";

const LABEL = "LOGIN";
const LOADING_LABEL = "Logging in...";

const WaveText = ({ text, animating }) => (
  <span className="wave-text">
    {text.split("").map((char, i) => (
      <span
        key={i}
        className="wave-text__char"
        style={animating ? { animationDelay: `${i * 60}ms` } : {}}>
        {char === " " ? "\u00A0" : char}
      </span>
    ))}
  </span>
);

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [showPass, setShowPass] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (form) => {
    try {
      const res = await login(form).unwrap();

      dispatch(
        setCredentials({
          user: res.data,
          token: res.token,
        }),
      );

      enqueueSnackbar(res.message || "Login successful.", {
        variant: "success",
      });

      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__left-top">
          <div className="login__brand">
            <div>
              <div className="login__brand-name">Aurora Depot</div>
              <div className="login__brand-sub">Management System</div>
            </div>
          </div>
          <h2 className="login__headline">
            Manage your depot
            <br />
            <span>smarter</span> and faster.
          </h2>
        </div>

        <div className="login__quality">
          <p>
            Authority when it comes to <span>quality...</span>
          </p>
        </div>
      </div>

      <div className="login__right">
        <div className="login__form-wrap">
          <div className="login__logo-row">
            <img src={AuroraIcon} alt="Aurora" className="login__logo" />
            <div className="login__logo-text">
              Aurora <span>Depot</span>
            </div>
          </div>

          <div className="login__title-row">
            <h3 className="login__title">Welcome back!</h3>
            <span className="login__badge">
              <ShieldOutlinedIcon sx={{ fontSize: "12px" }} />
              Secure Login
            </span>
          </div>

          <p className="login__subtitle">
            Sign in to your Aurora Depot account
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="login__field">
              <label className="login__label">
                Username <span className="login__required">★</span>
              </label>
              <div className="login__input-wrap">
                <PersonOutlinedIcon className="login__field-icon" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  {...register("username")}
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="login__error">
                  <ReportProblemIcon />
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="login__field">
              <label className="login__label">
                Password <span className="login__required">★</span>
              </label>
              <div className="login__input-wrap">
                <LockOutlinedIcon className="login__field-icon" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login__toggle-pass"
                  onClick={() => setShowPass((p) => !p)}>
                  {showPass ? (
                    <VisibilityOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="login__error">
                  <ReportProblemIcon />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`login__btn${isLoading ? " login__btn--loading" : ""}`}
              disabled={isLoading}>
              <WaveText
                text={isLoading ? LOADING_LABEL : LABEL}
                animating={isLoading}
              />
              {!isLoading && <ArrowForwardIcon sx={{ fontSize: "16px" }} />}
            </button>
          </form>

          <p className="login__footer">
            © 2026 <span>MIS</span>. All rights reserved.
          </p>

          <img src={MisLogo} alt="MIS" className="login__mis-logo" />
        </div>
      </div>
    </div>
  );
};

export default Login;
