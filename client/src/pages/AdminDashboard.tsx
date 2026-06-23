import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Bell,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  MessageSquareText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAllBookings } from "../services/bookingService";
import { getAdminCabins } from "../services/cabinService";

// Main admin should see work/action buttons immediately, not hidden after all stats.
type DashboardStats = {
  cabins: number;
  pendingCabins: number;
  rejectedCabins: number;
  approvedCabins: number;
  owners: number;
  bookings: number;
  pendingBookings: number;
  confirmedBookings: number;
};

type StatCard = {
  key: keyof DashboardStats;
  label: string;
  Icon: LucideIcon;
};

const statCards: StatCard[] = [
  { key: "pendingCabins", label: "Pending approvals", Icon: Inbox },
  { key: "pendingBookings", label: "Pending bookings", Icon: CalendarCheck },
  { key: "approvedCabins", label: "Approved cabins", Icon: CheckCircle2 },
  { key: "confirmedBookings", label: "Confirmed bookings", Icon: ShieldCheck },
  { key: "cabins", label: "Total cabins", Icon: Building2 },
  { key: "rejectedCabins", label: "Rejected cabins", Icon: XCircle },
];

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    cabins: 0,
    pendingCabins: 0,
    rejectedCabins: 0,
    approvedCabins: 0,
    owners: 0,
    bookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [cabinData, bookingData] = await Promise.all([getAdminCabins(), getAllBookings()]);
        setStats({
          cabins: cabinData.cabins.length,
          pendingCabins: cabinData.cabins.filter((cabin) => cabin.status === "PENDING").length,
          rejectedCabins: cabinData.cabins.filter((cabin) => cabin.status === "REJECTED").length,
          approvedCabins: cabinData.cabins.filter((cabin) => cabin.status === "APPROVED").length,
          owners: new Set(cabinData.cabins.map((cabin) => cabin.ownerId).filter(Boolean)).size,
          bookings: bookingData.bookings.length,
          pendingBookings: bookingData.bookings.filter((booking) => booking.status === "PENDING").length,
          confirmedBookings: bookingData.bookings.filter((booking) => booking.status === "CONFIRMED").length,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const actionCards = [
    {
      title: "Cabin approvals",
      description: `${stats.pendingCabins} cabins waiting for admin review`,
      to: "/admin/cabin-approvals",
      Icon: ClipboardCheck,
      primary: true,
    },
    {
      title: "Manage cabins",
      description: "Edit verified or rejected cabin details",
      to: "/admin/cabins",
      Icon: Building2,
    },
    {
      title: "Manage bookings",
      description: `${stats.pendingBookings} booking requests need attention`,
      to: "/admin/bookings",
      Icon: CalendarCheck,
    },
    {
      title: "Feedback inbox",
      description: "Read and delete user/owner feedback",
      to: "/admin/feedback",
      Icon: MessageSquareText,
    },
    {
      title: "Notifications",
      description: "Check all platform activity alerts",
      to: "/notifications",
      Icon: Bell,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="rounded-3xl bg-[#173f2a] p-7 text-white md:p-10">
        <p className="font-semibold text-[#f4b855]">Main Admin</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Admin dashboard</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-200">
              Review owner-submitted cabins, booking requests, feedback, and notifications from one easy place.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-xs uppercase tracking-wide text-[#f4b855]">Need attention</p>
            <p className="mt-3 text-3xl font-bold">{stats.pendingCabins + stats.pendingBookings}</p>
            <p className="mt-1 text-sm text-gray-200">pending cabin/booking items</p>
          </div>
        </div>
      </div>

      {loading && <p className="mt-8 rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading dashboard...</p>}
      {error && !loading && <p className="mt-8 rounded-md bg-red-100 p-6 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            {statCards.map(({ key, label, Icon }) => (
              <div key={key} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <h2 className="mt-2 text-4xl font-bold text-[#101918]">{stats[key]}</h2>
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

export default AdminDashboard;
