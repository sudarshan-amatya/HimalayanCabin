import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getApiAssetUrl } from "../services/api";
import { getAdminCabins, updateCabinStatus } from "../services/cabinService";
import type { Cabin, CabinStatus } from "../types";

function statusClass(status?: CabinStatus) {
  if (status === "APPROVED") return "bg-green-100 text-green-700";
  if (status === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function AdminCabinApprovals() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [filter, setFilter] = useState<CabinStatus | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchCabins() {
      try {
        const data = await getAdminCabins();
        setCabins(data.cabins);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load cabin approvals");
      } finally {
        setLoading(false);
      }
    }
    fetchCabins();
  }, []);

  const filteredCabins = useMemo(() => (filter === "ALL" ? cabins : cabins.filter((cabin) => cabin.status === filter)), [cabins, filter]);

  async function handleStatusChange(id: string, status: CabinStatus) {
    try {
      setActionId(id);
      setError("");
      setSuccess("");
      const data = await updateCabinStatus(id, status);
      setCabins((current) => current.map((cabin) => (cabin.id === id ? data.cabin : cabin)));
      setSuccess(`Cabin marked as ${status.toLowerCase()}.`);
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update cabin status");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Main Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">Cabin approvals</h1>
          <p className="mt-3 text-sm text-gray-600">Approve or reject owner-submitted cabins. Owner contact details are shown for verification.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/cabins" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">Manage cabins</Link>
          <Link to="/admin" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">Back to dashboard</Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${filter === item ? "bg-[#24472f] text-white" : "bg-[#eff8f5] text-[#24472f]"}`}>{item}</button>
        ))}
      </div>

      {error && <p className="mb-6 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      {loading ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading approvals...</p>
      ) : filteredCabins.length === 0 ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">No cabins in this filter.</p>
      ) : (
        <div className="grid gap-5">
          {filteredCabins.map((cabin) => (
            <article key={cabin.id} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
                {cabin.image ? <img src={getApiAssetUrl(cabin.image)} alt={cabin.name} className="h-44 w-full rounded-md object-cover" /> : <div className="h-44 rounded-md bg-[#eff8f5]" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-serif text-2xl font-bold text-[#101918]">{cabin.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(cabin.status)}`}>{cabin.status || "PENDING"}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{cabin.location} · Rs. {cabin.price.toLocaleString()}pp</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{cabin.description}</p>
                  <div className="mt-4 rounded-md bg-[#eff8f5] p-4 text-sm text-gray-700">
                    <p className="font-semibold text-[#101918]">Owner: {cabin.owner?.firstName} {cabin.owner?.lastName}</p>
                    <p className="break-words">{cabin.owner?.email}</p>
                    <p>{cabin.owner?.phone || "No contact number added"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:block lg:space-y-2">
                  <button disabled={actionId === cabin.id || cabin.status === "APPROVED"} onClick={() => handleStatusChange(cabin.id, "APPROVED")} className="cursor-pointer rounded-md bg-[#24472f] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Approve</button>
                  <button disabled={actionId === cabin.id || cabin.status === "REJECTED"} onClick={() => handleStatusChange(cabin.id, "REJECTED")} className="cursor-pointer rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50">Reject</button>
                  <button disabled={actionId === cabin.id || cabin.status === "PENDING"} onClick={() => handleStatusChange(cabin.id, "PENDING")} className="cursor-pointer rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Set pending</button>
                  <Link to={`/cabins/${cabin.id}`} className="block rounded-md bg-[#eff8f5] px-4 py-3 text-center text-sm font-semibold text-[#24472f]">View public page</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminCabinApprovals;
