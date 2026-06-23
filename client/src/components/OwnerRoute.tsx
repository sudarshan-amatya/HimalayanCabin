import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { getStoredUser, getToken } from "../utils/auth";

type OwnerRouteProps = {
  children: ReactNode;
};

function OwnerRoute({ children }: OwnerRouteProps) {
  const token = getToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "OWNER") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default OwnerRoute;
