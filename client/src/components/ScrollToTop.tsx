import { useEffect } from "react";
import { useLocation } from "react-router";

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (hash) {
        const id = decodeURIComponent(hash.replace("#", ""));
        const target = document.getElementById(id);

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
