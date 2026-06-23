import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import CabinForm, { type CabinFormPayload } from "../components/CabinForm";
import { getApiAssetUrl } from "../services/api";
import { getAdminCabins, updateCabin, updateCabinActiveStatus } from "../services/cabinService";
import type { Cabin, CabinStatus } from "../types";

function statusClass(status?: CabinStatus) {
  if (status === "APPROVED") return "bg-green-100 text-green-700";
  if (status === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function activeClass(isActive?: boolean) {
  return isActive === false ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700";
}

function AdminManageCabins() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [editingCabin, setEditingCabin] = useState<Cabin | null>(null);
  const [query, setQuery] = useState("");
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
        setError(error instanceof Error ? error.message : "Failed to load cabins");
      } finally {
        setLoading(false);
      }
    }
    fetchCabins();
  }, []);

  const filteredCabins = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return cabins;
    return cabins.filter((cabin) => `${cabin.name} ${cabin.location} ${cabin.owner?.email || ""}`.toLowerCase().includes(search));
  }, [cabins, query]);

  async function handleUpdate(payload: CabinFormPayload) {
    if (!editingCabin) return;
    const data = await updateCabin(editingCabin.id, payload);
    setCabins((current) => current.map((cabin) => (cabin.id === data.cabin.id ? data.cabin : cabin)));
    setEditingCabin(null);
    setSuccess("Cabin updated successfully.");
  }

  async function handleToggleActive(cabin: Cabin) {
    const nextActive = cabin.isActive === false;
    const action = nextActive ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} this cabin? This does not change its approval status.`)) return;

    try {
      setActionId(cabin.id);
      setError("");
      setSuccess("");
      const data = await updateCabinActiveStatus(cabin.id, nextActive);
      setCabins((current) => current.map((item) => (item.id === data.cabin.id ? data.cabin : item)));
      setSuccess(nextActive ? "Cabin activated successfully." : "Cabin deactivated successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update cabin active status");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Main Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">Manage cabins</h1>
          <p className="mt-3 text-sm text-gray-600">Admin can edit existing cabins. New cabins must be registered by cabin owners.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/cabin-approvals" className="rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">Approvals</Link>
          <Link to="/admin" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">Back to dashboard</Link>
        </div>
      </div>

      {error && <p className="mb-6 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      {editingCabin && (
        <div className="mb-10">
          <CabinForm key={editingCabin.id} initialCabin={editingCabin} title="Edit cabin details" submitLabel="Save changes" onSubmit={handleUpdate} onCancel={() => setEditingCabin(null)} />
        </div>
      )}

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by cabin, location, owner email" className="mb-6 w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />

      {loading ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading cabins...</p>
      ) : filteredCabins.length === 0 ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">No cabins found.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredCabins.map((cabin) => (
            <article key={cabin.id} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
              {cabin.image && <img src={getApiAssetUrl(cabin.image)} alt={cabin.name} className="h-48 w-full object-cover" />}
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-2xl font-bold text-[#101918]">{cabin.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(cabin.status)}`}>{cabin.status || "PENDING"}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeClass(cabin.isActive)}`}>{cabin.isActive === false ? "INACTIVE" : "ACTIVE"}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{cabin.location} · Rs. {cabin.price.toLocaleString()}pp</p>
                <p className="mt-3 text-xs text-gray-500">Owner: {cabin.owner?.firstName} {cabin.owner?.lastName} · {cabin.owner?.email}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => { setEditingCabin(cabin); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="cursor-pointer rounded-md bg-[#24472f] px-4 py-3 text-sm font-semibold text-white">Edit cabin</button>
                  <button type="button" disabled={actionId === cabin.id} onClick={() => handleToggleActive(cabin)} className="cursor-pointer rounded-md border border-[#24472f] px-4 py-3 text-sm font-semibold text-[#24472f] disabled:cursor-not-allowed disabled:opacity-60">{cabin.isActive === false ? "Activate" : "Deactivate"}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminManageCabins;
