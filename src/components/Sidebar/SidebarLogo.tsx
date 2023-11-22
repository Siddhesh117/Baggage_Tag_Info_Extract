import { useSelector, useDispatch } from "react-redux";
import { Dispatch, SetStateAction } from "react";
import {
  NAV_STYLE_FIXED,
  NAV_STYLE_MINI_SIDEBAR,
  THEME_TYPE_LITE,
  NAV_STYLE_DRAWER,
  TAB_SIZE,
} from "../../constants/ThemeSetting";
import type { RootState } from "../../appRedux/store";
import { toggleCollapsedSideNav } from "../../appRedux/actions";

type SidebarLogoProps = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
};

const SidebarLogo = ({
  sidebarCollapsed,
  setSidebarCollapsed,
}: SidebarLogoProps) => {
  const { themeType } = useSelector(({ settings }: RootState) => settings);
  const { width } = useSelector(({ common }: RootState) => common);
  const { navCollapsed } = useSelector(({ common }: RootState) => common);

  const dispatch = useDispatch();

  let navStyle = useSelector(({ settings }: RootState) => settings.navStyle);
  if (width < TAB_SIZE && navStyle === NAV_STYLE_FIXED) {
    navStyle = NAV_STYLE_DRAWER;
  }

  const hideLogoFunction = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    dispatch(toggleCollapsedSideNav(!navCollapsed));
  };
  return (
    <div className="gx-layout-sider-header">
      {navStyle === NAV_STYLE_FIXED || navStyle === NAV_STYLE_MINI_SIDEBAR ? (
        <div className="gx-linebar">
          <i
            className={`gx-icon-btn icon icon-menu  icon-${
              !sidebarCollapsed ? "menu-unfold" : "menu-fold"
            } ${themeType !== THEME_TYPE_LITE ? "gx-text-white" : ""}`}
            onClick={() => {
              hideLogoFunction();
            }}
            onMouseEnter={() => {
              hideLogoFunction();
            }}
          />
        </div>
      ) : null}

      {/* <span className="gx-site-logo">
        {navCollapsed && navStyle === NAV_STYLE_NO_HEADER_MINI_SIDEBAR && width >= TAB_SIZE ? (
          ""
        ) : (
          <img
            alt="adani_logo"
            src={adani_logo}
            style={{
              width: "90px",
              marginLeft: "18px"
            }}
          />
        )}
      </span> */}
    </div>
  );
};

export default SidebarLogo;
