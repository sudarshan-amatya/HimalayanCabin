import { createBrowserRouter } from "react-router";
import AdminRoute from "../components/AdminRoute";
import OwnerRoute from "../components/OwnerRoute";
import ProtectedRoute from "../components/ProtectedRoute";
import UserRoute from "../components/UserRoute";
import RootLayout from "../layouts/RootLayout";
import About from "../pages/About";
import AdminBookings from "../pages/AdminBookings";
import AdminCabinApprovals from "../pages/AdminCabinApprovals";
import AdminDashboard from "../pages/AdminDashboard";
import AdminFeedbacks from "../pages/AdminFeedbacks";
import AdminManageCabins from "../pages/AdminManageCabins";
import Booking from "../pages/Booking";
import BookingDetails from "../pages/BookingDetails";
import CabinDetails from "../pages/CabinDetails";
import Cabins from "../pages/Cabins";
import GetInspired from "../pages/GetInspired";
import GiftAStay from "../pages/GiftAStay";
import Home from "../pages/Home";
import Login from "../pages/Login";
import MyBookings from "../pages/MyBookings";
import MyBookmarks from "../pages/MyBookmarks";
import Notifications from "../pages/Notifications";
import OwnerAddCabin from "../pages/OwnerAddCabin";
import OwnerBookings from "../pages/OwnerBookings";
import OwnerDashboard from "../pages/OwnerDashboard";
import OwnerManageCabins from "../pages/OwnerManageCabins";
import PaymentResult from "../pages/PaymentResult";
import Profile from "../pages/Profile";
import ReceivedGifts from "../pages/ReceivedGifts";
import Signup from "../pages/Signup";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "cabins", element: <Cabins /> },
      { path: "cabins/:id", element: <CabinDetails /> },
      { path: "get-inspired", element: <GetInspired /> },
      { path: "gift-a-stay", element: <GiftAStay /> },
      { path: "about", element: <About /> },
      { path: "payment/success", element: <PaymentResult status="success" /> },
      { path: "payment/failure", element: <PaymentResult status="failure" /> },
      { path: "booking/:cabinId", element: <UserRoute><Booking /></UserRoute> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: "notifications", element: <ProtectedRoute><Notifications /></ProtectedRoute> },
      { path: "my-bookmarks", element: <UserRoute><MyBookmarks /></UserRoute> },
      { path: "my-bookings", element: <UserRoute><MyBookings /></UserRoute> },
      { path: "my-bookings/:id", element: <UserRoute><BookingDetails /></UserRoute> },
      { path: "my-gifts", element: <UserRoute><ReceivedGifts /></UserRoute> },
      { path: "owner", element: <OwnerRoute><OwnerDashboard /></OwnerRoute> },
      { path: "owner/cabins", element: <OwnerRoute><OwnerManageCabins /></OwnerRoute> },
      { path: "owner/cabins/new", element: <OwnerRoute><OwnerAddCabin /></OwnerRoute> },
      { path: "owner/bookings", element: <OwnerRoute><OwnerBookings /></OwnerRoute> },
      { path: "owner/bookings/:id", element: <OwnerRoute><BookingDetails /></OwnerRoute> },
      { path: "admin", element: <AdminRoute><AdminDashboard /></AdminRoute> },
      { path: "admin/cabins", element: <AdminRoute><AdminManageCabins /></AdminRoute> },
      { path: "admin/cabin-approvals", element: <AdminRoute><AdminCabinApprovals /></AdminRoute> },
      { path: "admin/bookings", element: <AdminRoute><AdminBookings /></AdminRoute> },
      { path: "admin/bookings/:id", element: <AdminRoute><BookingDetails /></AdminRoute> },
      { path: "admin/feedback", element: <AdminRoute><AdminFeedbacks /></AdminRoute> },
    ],
  },
]);
