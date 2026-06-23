import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { getStoredUser, getToken } from "../utils/auth";

type UserRouteProps = {
  children: ReactNode;
};

function UserRoute({ children }: UserRouteProps) {
  const location = useLocation();
  const token = getToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "USER") {
    if (user?.role === "OWNER") return <Navigate to="/owner" replace />;
    if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default UserRoute;
