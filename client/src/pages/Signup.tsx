import type React from "react";
import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { googleAuth, signupUser } from "../services/authService";
import type { UserRole } from "../types";
import { saveAuth } from "../utils/auth";

type SignupRole = Extract<UserRole, "USER" | "OWNER">;

type SignupFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: SignupRole;
};

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((previousData) => ({ ...previousData, [name]: value }));
  }

  function handleRoleChange(role: SignupRole) {
    setFormData((previousData) => ({ ...previousData, role }));
  }

  function destination(role: string, hasPhone = true) {
    if (!hasPhone) return "/profile";
    if (role === "OWNER") return "/owner";
    return "/";
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError("All fields are required, including contact number");
      return;
    }
    if (formData.phone.trim().length < 7) {
      setError("Please enter a valid contact number");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const data = await signupUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      });
      saveAuth(data.token, data.user);
      navigate(destination(data.user.role, Boolean(data.user.phone)));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleCredential = useCallback(
    async (credential: string, role?: SignupRole) => {
      try {
        setError("");
        setLoading(true);
        const data = await googleAuth({ credential, role: role || formData.role });
        saveAuth(data.token, data.user);
        navigate(destination(data.user.role, Boolean(data.user.phone)));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Google signup failed");
      } finally {
        setLoading(false);
      }
    },
    [formData.role, navigate],
  );

  return (
    <section className="mx-auto flex max-w-md px-4 py-20">
      <div className="w-full rounded-md bg-[#eff8f5] p-8 shadow-sm">
        <h1 className="font-serif text-4xl font-bold text-[#101918]">Create account</h1>
        <p className="mt-3 text-sm text-gray-600">Sign up as a guest to book cabins or as an owner to register your cabin.</p>
        {error && <p className="mt-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-8">
          <label className="mb-2 block text-sm font-medium text-gray-700">Account type</label>
          <div className="grid grid-cols-2 gap-3">
            {(["USER", "OWNER"] as SignupRole[]).map((role) => (
              <button key={role} type="button" onClick={() => handleRoleChange(role)} className={`cursor-pointer rounded-md border px-4 py-3 text-left text-sm ${formData.role === role ? "border-[#24472f] bg-white font-semibold text-[#24472f]" : "border-gray-300 bg-white/60 text-gray-600"}`}>
                {role === "USER" ? "Guest" : "Owner"}
                <span className="mt-1 block text-xs font-normal">{role === "USER" ? "Book cabins" : "List cabins"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-md bg-white p-3">
          <GoogleAuthButton role={formData.role} onCredential={handleGoogleCredential} onError={setError} />
          <p className="mt-3 text-xs leading-5 text-gray-500">Google signup creates your account quickly. Please add your contact number from Profile after login.</p>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> or create with email <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input id="firstName" name="firstName" type="text" placeholder="First name" value={formData.firstName} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          <input id="lastName" name="lastName" type="text" placeholder="Last name" value={formData.lastName} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          <input id="email" name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          <input id="phone" name="phone" type="tel" placeholder="Contact number" value={formData.phone} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          <input id="password" name="password" type="password" placeholder="Create password" value={formData.password} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          <button type="submit" disabled={loading} className="w-full cursor-pointer rounded-md bg-[#24472f] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-700">Already have an account? <Link to="/login" className="font-semibold text-[#24472f] underline">Login</Link></p>
      </div>
    </section>
  );
}

export default Signup;
