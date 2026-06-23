import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bell, Building2, CalendarCheck, CheckCircle2, Inbox, PlusCircle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getOwnerBookings } from "../services/bookingService";
import { getOwnerCabins } from "../services/cabinService";

type OwnerStats = {
  cabins: number;
  approvedCabins: number;
  pendingCabins: number;
  rejectedCabins: number;
  bookings: number;
  pendingBookings: number;
};

type StatCard = {
  label: string;
  value: number;
  Icon: LucideIcon;
};

function OwnerDashboard() {
  const [stats, setStats] = useState<OwnerStats>({ cabins: 0, approvedCabins: 0, pendingCabins: 0, rejectedCabins: 0, bookings: 0, pendingBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [cabinData, bookingData] = await Promise.all([getOwnerCabins(), getOwnerBookings()]);
        setStats({
          cabins: cabinData.cabins.length,
          approvedCabins: cabinData.cabins.filter((cabin) => cabin.status === "APPROVED").length,
          pendingCabins: cabinData.cabins.filter((cabin) => cabin.status === "PENDING").length,
          rejectedCabins: cabinData.cabins.filter((cabin) => cabin.status === "REJECTED").length,
          bookings: bookingData.bookings.length,
          pendingBookings: bookingData.bookings.filter((booking) => booking.status === "PENDING").length,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load owner dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const actionCards = [
    {
      title: "Add new cabin",
      description: "Submit a cabin for admin approval",
      to: "/owner/cabins/new",
      Icon: PlusCircle,
      primary: true,
    },
    {
      title: "Manage cabins",
      description: "Edit listings and check approval status",
      to: "/owner/cabins",
      Icon: Building2,
    },
    {
      title: "Booking requests",
      description: `${stats.pendingBookings} pending requests`,
      to: "/owner/bookings",
      Icon: CalendarCheck,
    },
    {
      title: "Notifications",
      description: "Approval and booking activity",
      to: "/notifications",
      Icon: Bell,
    },
  ];

  const statCards: StatCard[] = [
    { label: "My cabins", value: stats.cabins, Icon: Building2 },
    { label: "Approved cabins", value: stats.approvedCabins, Icon: CheckCircle2 },
    { label: "Pending approval", value: stats.pendingCabins, Icon: Inbox },
    { label: "Rejected cabins", value: stats.rejectedCabins, Icon: XCircle },
    { label: "Booking requests", value: stats.bookings, Icon: CalendarCheck },
    { label: "Pending bookings", value: stats.pendingBookings, Icon: Bell },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="rounded-3xl bg-[#202b29] p-7 text-white md:p-10">
        <p className="font-semibold text-[#f4b855]">Cabin Owner</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Owner dashboard</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-200">
              Manage your listings and respond to pending booking requests. Confirmed bookings are locked for owners, so main admin handles later changes.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-xs uppercase tracking-wide text-[#f4b855]">Need attention</p>
            <p className="mt-3 text-3xl font-bold">{stats.pendingCabins + stats.pendingBookings}</p>
            <p className="mt-1 text-sm text-gray-200">pending approvals/bookings</p>
          </div>
        </div>
      </div>

      {loading && <p className="mt-8 rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading dashboard...</p>}
      {error && !loading && <p className="mt-8 rounded-md bg-red-100 p-6 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actionCards.map(({ title, description, to, Icon, primary }) => (
              <Link
                key={title}
                to={to}
                className={`group rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                  primary ? "bg-[#f4b855] text-[#101918]" : "border border-gray-100 bg-white text-[#101918] shadow-sm"
                }`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${primary ? "bg-white/60" : "bg-[#eff8f5] text-[#24472f]"}`}>
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 font-serif text-xl font-bold">{title}</h2>
                <p className={`mt-2 text-sm leading-6 ${primary ? "text-[#283326]" : "text-gray-600"}`}>{description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map(({ label, value, Icon }) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <h2 className="mt-2 text-4xl font-bold text-[#101918]">{value}</h2>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eff8f5] text-[#24472f]">
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default OwnerDashboard;
