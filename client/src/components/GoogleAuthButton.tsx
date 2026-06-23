import { useEffect, useRef, useState } from "react";
import type { UserRole } from "../types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type GoogleAuthButtonProps = {
  label?: string;
  role?: Extract<UserRole, "USER" | "OWNER">;
  onCredential: (credential: string, role?: Extract<UserRole, "USER" | "OWNER">) => Promise<void> | void;
  onError?: (message: string) => void;
};

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function GoogleAuthButton({ role, onCredential, onError }: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) {
      onError?.("VITE_GOOGLE_CLIENT_ID is missing in client .env");
      return;
    }

    if (window.google?.accounts?.id) {
      setReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src=\"${GOOGLE_SCRIPT_SRC}\"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => setReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => onError?.("Could not load Google sign-in script");
    document.head.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (!ready || !clientId || !buttonRef.current || !window.google?.accounts?.id) return;

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) {
          onError?.("Google did not return a login credential");
          return;
        }
        onCredential(response.credential, role);
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: "100%",
      text: "continue_with",
    });
  }, [ready, clientId, role, onCredential, onError]);

  if (!clientId) {
    return (
      <p className="rounded-md bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
        Add VITE_GOOGLE_CLIENT_ID to client .env to enable Google login.
      </p>
    );
  }

  return <div ref={buttonRef} className="flex min-h-11 w-full justify-center" />;
}

export default GoogleAuthButton;
