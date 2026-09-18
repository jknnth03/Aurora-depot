import { useState, useRef, useEffect } from "react";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./RowMenu.scss";

const RowMenu = ({
  onArchive,
  onRestore,
  onResetPassword,
  onActivate,
  isArchived = false,
  isActive = false,
  hideArchive = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = (e) => {
    e.stopPropagation();
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right - 140,
    });
    setOpen((p) => !p);
  };

  return (
    <div className="row-menu" ref={triggerRef}>
      <button
        className={`row-menu__trigger${className ? ` ${className}` : ""}`}
        onClick={handleOpen}>
        <MoreHorizIcon fontSize="small" />
      </button>

      {open && (
        <div
          className="row-menu__dropdown"
          style={{ position: "fixed", top: pos.top, left: pos.left }}>
          {!isArchived && onResetPassword && (
            <button
              className="row-menu__item row-menu__item--primary"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onResetPassword?.();
              }}>
              <LockResetIcon sx={{ fontSize: "0.95rem" }} />
              Reset Password
            </button>
          )}

          {onActivate && (
            <button
              className={`row-menu__item row-menu__item--primary${
                isActive ? " row-menu__item--disabled" : ""
              }`}
              disabled={isActive}
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) return;
                setOpen(false);
                onActivate?.();
              }}>
              <CheckCircleIcon sx={{ fontSize: "0.95rem" }} />
              {isActive ? "Already Active" : "Activate"}
            </button>
          )}

          {!hideArchive &&
            (isArchived ? (
              <button
                className="row-menu__item row-menu__item--restore"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onRestore?.();
                }}>
                <UnarchiveIcon sx={{ fontSize: "0.95rem" }} />
                Restore
              </button>
            ) : (
              <button
                className="row-menu__item row-menu__item--danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onArchive?.();
                }}>
                <ArchiveIcon sx={{ fontSize: "0.95rem" }} />
                Archive
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default RowMenu;
