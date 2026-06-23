import { Bell, Bookmark, CalendarCheck, CircleUserRound, Gift, LogOut, Menu, ShieldCheck, Store, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { getApiAssetUrl } from "../services/api";
import { getNotifications } from "../services/notificationService";
import type { User } from "../types";
import { clearAuth, getStoredUser, getUserInitials } from "../utils/auth";

const navLinks = [
  { label: "Our cabins", to: "/cabins" },
  { label: "Get inspired", to: "/get-inspired" },
  { label: "Gift a stay", to: "/gift-a-stay" },
  { label: "About us", to: "/about" },
];

function scrollTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function refreshNotifications(currentUser: User | null = getStoredUser()) {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    try {
      const data = await getNotifications();
      setUnreadCount(data.unreadCount);
    } catch {
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    function syncUser() {
      const storedUser = getStoredUser();
      setUser(storedUser);
      refreshNotifications(storedUser);
    }

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("notifications-changed", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-changed", syncUser);
      window.removeEventListener("notifications-changed", syncUser);
    };
  }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "text-[#173f2a] font-semibold" : "text-gray-800 hover:text-[#173f2a]";

  function handleLogout() {
    clearAuth();
    setProfileOpen(false);
    setMenuOpen(false);
    setUnreadCount(0);
    scrollTop();
    navigate("/login");
  }

  function closeMenus() {
    setMenuOpen(false);
    setProfileOpen(false);
    scrollTop();
  }

  const initials = getUserInitials(user);
  const isCustomer = user?.role === "USER";
  const isOwner = user?.role === "OWNER";
  const isAdmin = user?.role === "ADMIN";

  const dashboardLink = isAdmin ? "/admin" : isOwner ? "/owner" : "/profile";

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link to="/" onClick={closeMenus} className="text-xl font-extrabold tracking-wide">
          <span className="text-[#17703a]">HIMALAYAN</span><span className="text-[#173f2a]">CABINS</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={scrollTop} className={navClass}>{link.label}</NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/notifications" onClick={scrollTop} className="relative rounded-full border border-[#173f2a]/20 bg-[#eff8f5] p-3 text-[#173f2a]" aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f4b855] px-1 text-[10px] font-bold text-[#101918]">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>

              <div className="relative">
                <button type="button" onClick={() => setProfileOpen((current) => !current)} className="flex cursor-pointer items-center gap-2 rounded-full border border-[#173f2a]/20 bg-[#eff8f5] p-2 text-sm font-semibold text-[#173f2a]" aria-label="Open user menu">
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#173f2a] text-xs font-bold text-white">
                    {user.profileImage ? <img src={getApiAssetUrl(user.profileImage)} alt="Profile" className="h-full w-full object-cover" /> : initials}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-72 rounded-md border border-black/10 bg-white p-2 text-sm shadow-xl">
                    <div className="border-b border-black/10 px-3 py-3">
                      <p className="font-semibold text-[#101918]">{user.firstName} {user.lastName}</p>
                      <p className="mt-1 break-words text-xs text-gray-500">{user.email}</p>
                      <p className="mt-2 inline-block rounded-full bg-[#eff8f5] px-2 py-1 text-[11px] font-semibold text-[#173f2a]">{user.role === "OWNER" ? "Cabin owner" : user.role === "ADMIN" ? "Main admin" : "Guest"}</p>
                    </div>

                    <Link to="/profile" onClick={closeMenus} className="mt-2 flex items-center gap-2 rounded px-3 py-2 hover:bg-[#eff8f5]"><UserRound size={16} /> Profile</Link>
                    <Link to="/notifications" onClick={closeMenus} className="flex items-center justify-between rounded px-3 py-2 hover:bg-[#eff8f5]"><span className="flex items-center gap-2"><Bell size={16} /> Notifications</span>{unreadCount > 0 && <span className="rounded-full bg-[#f4b855] px-2 py-0.5 text-[11px] font-bold text-[#101918]">{unreadCount}</span>}</Link>

                    {isCustomer && (
                      <>
                        <Link to="/my-bookmarks" onClick={closeMenus} className="flex items-center gap-2 rounded px-3 py-2 hover:bg-[#eff8f5]"><Bookmark size={16} /> My bookmarks</Link>
                        <Link to="/my-bookings" onClick={closeMenus} className="flex items-center gap-2 rounded px-3 py-2 hover:bg-[#eff8f5]"><CalendarCheck size={16} /> My bookings</Link>
                        <Link to="/my-gifts" onClick={closeMenus} className="flex items-center gap-2 rounded px-3 py-2 hover:bg-[#eff8f5]"><Gift size={16} /> Gifts received</Link>
                      </>
                    )}

                    {isOwner && <Link to="/owner" onClick={closeMenus} className="flex items-center gap-2 rounded px-3 py-2 font-semibold text-[#173f2a] hover:bg-[#eff8f5]"><Store size={16} /> Owner dashboard</Link>}
                    {isAdmin && <Link to="/admin" onClick={closeMenus} className="flex items-center gap-2 rounded px-3 py-2 font-semibold text-[#173f2a] hover:bg-[#eff8f5]"><ShieldCheck size={16} /> Admin dashboard</Link>}

                    <button type="button" onClick={handleLogout} className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-red-600 hover:bg-red-50"><LogOut size={16} /> Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" onClick={scrollTop} className="rounded-full border border-[#173f2a] p-2 text-[#173f2a] transition hover:bg-[#eff8f5]" aria-label="Login"><CircleUserRound size={22} /></Link>
          )}
        </div>

        <button type="button" onClick={() => setMenuOpen((current) => !current)} className="cursor-pointer rounded-md p-2 md:hidden" aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      </nav>

      {menuOpen && (
        <div className="border-t border-black/5 bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm">
            {navLinks.map((link) => <NavLink key={link.to} to={link.to} onClick={closeMenus} className={navClass}>{link.label}</NavLink>)}
            <div className="mt-3 border-t border-black/10 pt-3">
              {user ? (
                <div className="space-y-2">
                  <Link to={dashboardLink} onClick={closeMenus} className="flex items-center gap-3 rounded-md bg-[#eff8f5] p-3 font-semibold text-[#173f2a]">
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#173f2a] text-xs text-white">{user.profileImage ? <img src={getApiAssetUrl(user.profileImage)} alt="Profile" className="h-full w-full object-cover" /> : initials}</span>
                    <span>{user.firstName} {user.lastName}<span className="block text-xs font-normal text-gray-500">{user.role}</span></span>
                  </Link>
                  <Link to="/notifications" onClick={closeMenus} className="flex items-center gap-2 py-2"><Bell size={16} /> Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}</Link>
                  <Link to="/profile" onClick={closeMenus} className="flex items-center gap-2 py-2"><UserRound size={16} /> Profile</Link>
                  {isCustomer && <><Link to="/my-bookmarks" onClick={closeMenus} className="flex items-center gap-2 py-2"><Bookmark size={16} /> My bookmarks</Link><Link to="/my-bookings" onClick={closeMenus} className="flex items-center gap-2 py-2"><CalendarCheck size={16} /> My bookings</Link><Link to="/my-gifts" onClick={closeMenus} className="flex items-center gap-2 py-2"><Gift size={16} /> Gifts received</Link></>}
                  {isOwner && <Link to="/owner" onClick={closeMenus} className="block py-2 font-semibold text-[#173f2a]">Owner dashboard</Link>}
                  {isAdmin && <Link to="/admin" onClick={closeMenus} className="block py-2 font-semibold text-[#173f2a]">Admin dashboard</Link>}
                  <button type="button" onClick={handleLogout} className="flex w-full cursor-pointer items-center gap-2 py-2 text-left text-red-600"><LogOut size={16} /> Logout</button>
                </div>
              ) : (
                <Link to="/login" onClick={closeMenus} className="flex items-center gap-2 font-semibold text-[#173f2a]"><CircleUserRound size={18} /> Login</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
