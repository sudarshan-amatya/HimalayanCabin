import { useEffect, useState } from "react";
import { Link } from "react-router";
import CabinForm, { type CabinFormPayload } from "../components/CabinForm";
import { getApiAssetUrl } from "../services/api";
import { deleteCabin, getOwnerCabins, updateCabin, updateCabinActiveStatus } from "../services/cabinService";
import type { Cabin, CabinStatus } from "../types";

function statusClass(status?: CabinStatus) {
  if (status === "APPROVED") return "bg-green-100 text-green-700";
  if (status === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function activeClass(isActive?: boolean) {
  return isActive === false ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700";
}

function OwnerManageCabins() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [editingCabin, setEditingCabin] = useState<Cabin | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchCabins() {
    try {
      setError("");
      const data = await getOwnerCabins();
      setCabins(data.cabins);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load cabins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCabins();
  }, []);

  async function handleUpdate(payload: CabinFormPayload) {
    if (!editingCabin) return;
    const data = await updateCabin(editingCabin.id, payload);
    setCabins((current) => current.map((cabin) => (cabin.id === data.cabin.id ? data.cabin : cabin)));
    setEditingCabin(null);
    setSuccess("Cabin updated and sent for admin approval.");
    window.dispatchEvent(new Event("notifications-changed"));
  }

  async function handleToggleActive(cabin: Cabin) {
    const nextActive = cabin.isActive === false;
    const action = nextActive ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} this cabin? This does not need admin approval.`)) return;

    try {
      setActionId(cabin.id);
      setError("");
      setSuccess("");
      const data = await updateCabinActiveStatus(cabin.id, nextActive);
      setCabins((current) => current.map((item) => (item.id === data.cabin.id ? data.cabin : item)));
      setSuccess(nextActive ? "Cabin activated successfully." : "Cabin deactivated successfully. It is hidden from public listings.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update cabin active status");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this cabin?")) return;

    try {
      setActionId(id);
      setError("");
      setSuccess("");
      await deleteCabin(id);
      setCabins((current) => current.filter((cabin) => cabin.id !== id));
      setSuccess("Cabin deleted successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete cabin");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Cabin Owner</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">Manage my cabins</h1>
          <p className="mt-3 text-sm text-gray-600">Edit cabins, view approval status, or add a new property.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/owner/cabins/new" className="rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">Add new cabin</Link>
          <Link to="/owner" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">Back to dashboard</Link>
        </div>
      </div>

      {error && <p className="mb-6 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      {editingCabin && (
        <div className="mb-10">
          <CabinForm key={editingCabin.id} initialCabin={editingCabin} title="Edit cabin" submitLabel="Update cabin" onSubmit={handleUpdate} onCancel={() => setEditingCabin(null)} />
        </div>
      )}

      {loading ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading cabins...</p>
      ) : cabins.length === 0 ? (
        <div className="rounded-md bg-[#eff8f5] p-10 text-center">
          <h2 className="font-serif text-2xl font-bold">No cabins added yet</h2>
          <p className="mt-2 text-sm text-gray-600">Add your first cabin and send it for approval.</p>
          <Link to="/owner/cabins/new" className="mt-6 inline-block rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">Add cabin</Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {cabins.map((cabin) => (
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
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">{cabin.description}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <button type="button" onClick={() => { setEditingCabin(cabin); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="cursor-pointer rounded-md bg-[#24472f] px-4 py-3 text-sm font-semibold text-white">Edit</button>
                  <button type="button" disabled={actionId === cabin.id} onClick={() => handleToggleActive(cabin)} className="cursor-pointer rounded-md border border-[#24472f] px-4 py-3 text-sm font-semibold text-[#24472f] disabled:cursor-not-allowed disabled:opacity-60">{cabin.isActive === false ? "Activate" : "Deactivate"}</button>
                  <button type="button" disabled={actionId === cabin.id} onClick={() => handleDelete(cabin.id)} className="cursor-pointer rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-60">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default OwnerManageCabins;
