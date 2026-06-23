import { Outlet } from "react-router";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import ScrollToTop from "../components/ScrollToTop";

function RootLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#101918]">
      <ScrollToTop />
      <Navbar />
      <main className="overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default RootLayout;
