import { Bookmark, CalendarCheck, ShieldCheck, Store, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { User } from "../types";
import { getStoredUser } from "../utils/auth";

type FooterLink = {
  label: string;
  to: string;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

function scrollTop() {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 0);
}

function getRoleLabel(user: User | null) {
  if (!user) return "Guest visitor";
  if (user.role === "ADMIN") return "Main admin";
  if (user.role === "OWNER") return "Cabin owner";
  return "Guest account";
}

function Footer() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    function syncUser() {
      setUser(getStoredUser());
    }

    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-changed", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-changed", syncUser);
    };
  }, []);

  const footerData = useMemo(() => {
    const exploreLinks: FooterLink[] = [
      { label: "All cabins", to: "/cabins" },
      { label: "Nagarkot cabins", to: "/cabins?location=Nagarkot" },
      { label: "Pokhara cabins", to: "/cabins?location=Pokhara" },
      { label: "Chitlang cabins", to: "/cabins?location=Chitlang" },
    ];

    const inspirationLinks: FooterLink[] = [
      { label: "Get inspired", to: "/get-inspired" },
      { label: "Gift a stay", to: "/gift-a-stay" },
      { label: "About HimalayanCabins", to: "/about" },
      { label: "FAQ", to: "/#faq" },
    ];

    if (user?.role === "ADMIN") {
      return {
        eyebrow: "Platform tools",
        title: "Keep HimalayanCabins clean and verified",
        description:
          "Review cabin submissions, monitor bookings, and keep the public website focused on approved Nepal stays.",
        cta: { label: "Open admin dashboard", to: "/admin" },
        icon: ShieldCheck,
        groups: [
          {
            title: "Admin",
            links: [
              { label: "Dashboard", to: "/admin" },
              { label: "Manage cabins", to: "/admin/cabins" },
              { label: "Manage bookings", to: "/admin/bookings" },
              { label: "Public cabins", to: "/cabins" },
            ],
          },
          { title: "Public site", links: inspirationLinks },
          { title: "Cabin locations", links: exploreLinks },
        ] as FooterGroup[],
      };
    }

    if (user?.role === "OWNER") {
      return {
        eyebrow: "Owner tools",
        title: "Manage your cabin listing with confidence",
        description:
          "Add cabin details, upload photos, and confirm bookings only for the stays you own.",
        cta: { label: "Open owner dashboard", to: "/owner" },
        icon: Store,
        groups: [
          {
            title: "Owner",
            links: [
              { label: "Dashboard", to: "/owner" },
              { label: "My cabins", to: "/owner/cabins" },
              { label: "Cabin bookings", to: "/owner/bookings" },
              { label: "Profile", to: "/profile" },
            ],
          },
          { title: "Public site", links: inspirationLinks },
          { title: "Cabin locations", links: exploreLinks },
        ] as FooterGroup[],
      };
    }

    if (user?.role === "USER") {
      return {
        eyebrow: "Your cabin escape",
        title: "Plan, save, and track your peaceful stays",
        description:
          "Save cabins you like, book approved stays, and check booking status from your account.",
        cta: { label: "View my bookings", to: "/my-bookings" },
        icon: CalendarCheck,
        groups: [
          {
            title: "My account",
            links: [
              { label: "Profile", to: "/profile" },
              { label: "My bookings", to: "/my-bookings" },
              { label: "My bookmarks", to: "/my-bookmarks" },
              { label: "Gift a stay", to: "/gift-a-stay" },
            ],
          },
          { title: "Explore", links: exploreLinks },
          { title: "Inspiration", links: inspirationLinks },
        ] as FooterGroup[],
      };
    }

    return {
      eyebrow: "Nepal cabin stays",
      title: "Find a calm cabin escape near nature",
      description:
        "Browse approved cabins around Nepal, get inspired, or create an account to save and book your next stay.",
      cta: { label: "Find the perfect getaway", to: "/cabins" },
      icon: UserRound,
      groups: [
        { title: "Explore", links: exploreLinks },
        { title: "Inspiration", links: inspirationLinks },
        {
          title: "Account",
          links: [
            { label: "Login", to: "/login" },
            { label: "Create guest account", to: "/signup" },
            { label: "Register as owner", to: "/signup" },
            { label: "Contact us", to: "/about" },
          ],
        },
      ] as FooterGroup[],
    };
  }, [user]);

  const FooterIcon = footerData.icon;

  return (
    <footer className="bg-[#08110f] text-gray-300">
      <section className="relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 text-white md:grid-cols-[1fr_360px] md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c9f2df] backdrop-blur">
              <FooterIcon size={15} /> {footerData.eyebrow}
            </p>
            <h2 className="mt-5 max-w-xl font-serif text-4xl font-bold leading-tight md:text-5xl">
              {footerData.title}
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-gray-100">
              {footerData.description}
            </p>
            <Link
              to={footerData.cta.to}
              onClick={scrollTop}
              className="mt-8 inline-block rounded-md bg-[#dff3ee] px-6 py-3 text-sm font-semibold text-[#101918] transition hover:bg-white"
            >
              {footerData.cta.label}
            </Link>
          </div>

          <div className="rounded-md border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9f2df]">Current access</p>
            <p className="mt-3 font-serif text-2xl font-bold">{getRoleLabel(user)}</p>
            <p className="mt-3 text-sm leading-6 text-gray-100">
              {user
                ? `${user.firstName} ${user.lastName}`
                : "Login or create an account to unlock booking, bookmarks, and owner tools."}
            </p>
            {user?.role === "USER" && (
              <Link to="/my-bookmarks" onClick={scrollTop} className="mt-5 inline-flex items-center gap-2 text-sm text-[#f4b855] hover:text-white">
                <Bookmark size={16} /> View saved cabins
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-4">
        <div>
          <Link to="/" onClick={scrollTop} className="text-xl font-extrabold">
            <span className="text-white">HIMALAYAN</span>
            <span className="text-[#c9f2df]">CABINS</span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-gray-400">
            Cabin booking for nature stays across Nepal.
          </p>
        </div>

        {footerData.groups.map((group) => (
          <div key={group.title}>
            <h3 className="font-semibold text-[#c9f2df]">{group.title}</h3>
            <ul className="mt-5 space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}>
                  <Link to={link.to} onClick={scrollTop} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-white/10 px-4 py-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 HimalayanCabins. All rights reserved.</p>
        <p>Approved Nepal cabins </p>
      </section>
    </footer>
  );
}

export default Footer;
