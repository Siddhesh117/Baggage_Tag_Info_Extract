import UserProfile from "./UserProfile";
import { Layout } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  NAV_STYLE_DRAWER,
  NAV_STYLE_FIXED,
  NAV_STYLE_MINI_SIDEBAR,
  TAB_SIZE,
} from "../../constants/ThemeSetting";
import { toggleCollapsedSideNav } from "../../appRedux/actions";
import styles from "./index.module.css";
import type { RootState } from "../../appRedux/store/index";

const { Header } = Layout;

const Topbar = () => {
  const dispatch = useDispatch();
  const { navStyle } = useSelector(({ settings }: RootState) => settings);
  const { navCollapsed, width } = useSelector(
    ({ common }: RootState) => common
  );

  return (
    <Header>
      {navStyle === NAV_STYLE_DRAWER ||
      ((navStyle === NAV_STYLE_FIXED || navStyle === NAV_STYLE_MINI_SIDEBAR) &&
        width < TAB_SIZE) ? (
        <div className="gx-linebar gx-mr-3">
          <i
            className="gx-icon-btn icon icon-menu"
            onClick={() => {
              dispatch(toggleCollapsedSideNav(!navCollapsed));
            }}
          />
        </div>
      ) : null}
      <div className={styles["topbar"]}>
        {!navCollapsed &&
          // <img
          //   alt="adani_logo"
          //   src={adani_logo}
          //   style={{
          //     width: "90px",
          //     cursor: "pointer",
          //   }}
          //   onClick={() => history.push(`/`)}
          // />
          ""}

        <div
          style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
        >
          <UserProfile />
        </div>
      </div>
    </Header>
  );
};

export default Topbar;
