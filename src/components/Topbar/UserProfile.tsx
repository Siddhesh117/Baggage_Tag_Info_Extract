import { useState } from "react";
import { Avatar, Popover, message } from "antd";
// import { useHistory } from "react-router";
import styles from "./UserProfile.module.css";
import user_image from "../../assets/pictures/user_image.jpg";

const UserProfile = () => {
  // CONSTANTS
  // const history = useHistory();

  // STATE
  const [open, setOpen] = useState<boolean>(false);

  // HANDLERS

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleAbout = () => {
    hide();
    // history.push("/");
  };

  const handleLogOut = () => {
    message.destroy();
    localStorage.clear();
    message.destroy();
    message.success("Logout Successful!");
    window.location.assign("/");
  };

  /* navigate to coming soon page */
  const handleAccount = () => {
    // history.push("/");
  };

  const userMenuOptions = (
    <ul className="gx-user-popover">
      {/* <li
        onClick={() => {
          hide();
          handleAccount();
        }}
      >
        My Account{" "}
      </li> */}
      {/* <li
        onClick={() => {
          hide();
          changePassword();
        }}
      >
        Change Password
      </li> */}
      {/* <li onClick={handleAbout}>About</li> */}
      <li onClick={handleLogOut}>Logout</li>
    </ul>
  );
  const changePassword = () => {
    // history.push(`/`);
  };
  const hide = () => {
    setOpen(false);
  };

  return (
    <div
      className={`gx-flex-row gx-align-items-center gx-mb-4 gx-avatar-row ${styles["user-profile"]}`}
    >
      <Popover
        placement="bottomRight"
        // content={userMenuOptions}
        trigger="click"
        open={open}
        onOpenChange={handleOpenChange}
      >
        <Avatar
          src={user_image}
          className="gx-size-40 gx-pointer gx-mr-3"
          alt=""
        />
        <span className={`gx-avatar-name ${styles["username"]}`}>
          user
          <i className="icon icon-chevron-down gx-fs-xxs gx-ml-2" />
        </span>
      </Popover>
    </div>
  );
};

export default UserProfile;
