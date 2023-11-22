import { Route, Switch, useRouteMatch } from "react-router-dom";
import { memo } from "react";
import Home from "../pages/Home";

const App = () => {
  const match = useRouteMatch();
  return (
    <div className="gx-main-content-wrapper">
      <Switch>
        {/* Dashboards */}
        <Route exact path={`${match.path}`} component={Home} />
      </Switch>
    </div>
  );
};

export default memo(App);
