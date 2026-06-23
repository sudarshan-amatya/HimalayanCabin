import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { getStoredUser, getToken } from "../utils/auth";

type AdminRouteProps = {
  children: ReactNode;
};

function AdminRoute({ children }: AdminRouteProps) {
  const token = getToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
