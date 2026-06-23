import { useState } from "react";
import { Link, useNavigate } from "react-router";
import CabinForm, { type CabinFormPayload } from "../components/CabinForm";
import { createCabin } from "../services/cabinService";

function OwnerAddCabin() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState("");

  async function handleCreate(payload: CabinFormPayload) {
    const data = await createCabin(payload);
    setSuccess(`${data.cabin.name} submitted for admin approval.`);
    window.dispatchEvent(new Event("notifications-changed"));
    setTimeout(() => navigate("/owner/cabins"), 700);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Cabin Owner</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">Add new cabin</h1>
          <p className="mt-3 text-sm text-gray-600">New cabins are reviewed by the main admin before appearing publicly.</p>
        </div>
        <Link to="/owner/cabins" className="w-fit rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">Back to manage cabins</Link>
      </div>

      {success && <p className="mb-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}
      <CabinForm title="Cabin information" submitLabel="Submit cabin for approval" onSubmit={handleCreate} />
    </section>
  );
}

export default OwnerAddCabin;
