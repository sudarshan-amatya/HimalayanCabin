import type React from "react";
import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { googleAuth, loginUser } from "../services/authService";
import { saveAuth } from "../utils/auth";

type LoginFormData = {
  email: string;
  password: string;
};

function getDashboardPath(role: string) {
  if (role === "OWNER") return "/owner";
  if (role === "ADMIN") return "/admin";
  return "/";
}

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((previousData) => ({ ...previousData, [name]: value }));
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const data = await loginUser({ email: formData.email, password: formData.password });
      saveAuth(data.token, data.user);
      navigate(getDashboardPath(data.user.role));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      try {
        setError("");
        setLoading(true);
        const data = await googleAuth({ credential });
        saveAuth(data.token, data.user);
        navigate(data.user.phone ? getDashboardPath(data.user.role) : "/profile");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  return (
    <section className="mx-auto flex max-w-md px-4 py-20">
      <div className="w-full rounded-md bg-[#eff8f5] p-8 shadow-sm">
        <h1 className="font-serif text-4xl font-bold text-[#101918]">Login</h1>
        <p className="mt-3 text-sm text-gray-600">Welcome back to HimalayanCabins.</p>

        {error && <p className="mt-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-7 rounded-md bg-white p-3">
          <GoogleAuthButton onCredential={handleGoogleCredential} onError={setError} />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> or login with email <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
          </div>
          <button type="submit" disabled={loading} className="w-full cursor-pointer rounded-md bg-[#24472f] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-700">
          New here? <Link to="/signup" className="font-semibold text-[#24472f] underline">Create account</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
