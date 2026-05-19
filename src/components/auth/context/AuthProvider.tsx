import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
};

type AuthState = {
  loading: boolean;
  initialized: boolean;
  authenticated: boolean;
  user: GoogleProfile | null;
  credential: string | null;
  error: string | null;
};

type AuthContextValue = AuthState & {
  signInWithGoogle: () => Promise<GoogleProfile>;
  signOut: () => Promise<void>;
  initializeGoogleAuth: () => Promise<void>;
};

type TProps = {
  children: ReactNode;
  clientId?: string;
};

type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
};

type GoogleIdentityService = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  prompt: (
    notificationCallback?: (notification: GooglePromptNotification) => void,
  ) => void;
  disableAutoSelect: () => void;
};

type GoogleAccounts = {
  id: GoogleIdentityService;
};

type GoogleWindow = {
  accounts: GoogleAccounts;
};

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const defaultAuthState: AuthState = {
  loading: false,
  initialized: false,
  authenticated: false,
  user: null,
  credential: null,
  error: null,
};

const AuthContext = createContext<AuthContextValue>({
  ...defaultAuthState,
  signInWithGoogle: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signOut: async () => undefined,
  initializeGoogleAuth: async () => undefined,
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () =>
          reject(new Error("Failed to load Google Identity Services script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });
}

function decodeGoogleCredential(credential: string): GoogleProfile | null {
  const payload = credential.split(".")[1];

  if (!payload) {
    return null;
  }

  const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
  const paddedPayload = normalizedPayload.padEnd(
    normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
    "=",
  );

  try {
    const decoded = atob(paddedPayload);
    const parsed = JSON.parse(decoded) as Record<string, unknown>;

    return {
      id: String(parsed.sub ?? ""),
      email: String(parsed.email ?? ""),
      name: String(parsed.name ?? ""),
      givenName: parsed.given_name ? String(parsed.given_name) : undefined,
      familyName: parsed.family_name ? String(parsed.family_name) : undefined,
      picture: parsed.picture ? String(parsed.picture) : undefined,
    };
  } catch {
    return null;
  }
}

const AuthProvider: FC<TProps> = ({ children, clientId = googleClientId }) => {
  const [state, setState] = useState<AuthState>(defaultAuthState);

  const initializeGoogleAuth = useCallback(async () => {
    if (!clientId) {
      setState((current) => ({
        ...current,
        initialized: false,
        error: "Missing VITE_GOOGLE_CLIENT_ID",
      }));
      return;
    }

    await loadGoogleIdentityScript();

    if (!window.google?.accounts?.id) {
      throw new Error("Google Identity Services not available");
    }

    setState((current) => ({
      ...current,
      initialized: true,
      error: null,
    }));
  }, [clientId]);

  useEffect(() => {
    initializeGoogleAuth().catch((error: Error) => {
      setState((current) => ({
        ...current,
        initialized: false,
        error: error.message,
      }));
    });
  }, [initializeGoogleAuth]);

  const signInWithGoogle = useCallback(async () => {
    if (!clientId) {
      throw new Error("Missing VITE_GOOGLE_CLIENT_ID");
    }

    await initializeGoogleAuth();

    const google = window.google as GoogleWindow | undefined;

    if (!google?.accounts?.id) {
      throw new Error("Google Identity Services not available");
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    return new Promise<GoogleProfile>((resolve, reject) => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GoogleCredentialResponse) => {
          const profile = decodeGoogleCredential(response.credential);

          if (!profile) {
            const error = new Error("Unable to decode Google credential");
            setState((current) => ({
              ...current,
              loading: false,
              error: error.message,
            }));
            reject(error);
            return;
          }

          setState((current) => ({
            ...current,
            loading: false,
            authenticated: true,
            user: profile,
            credential: response.credential,
            error: null,
          }));

          resolve(profile);
        },
      });

      google.accounts.id.prompt((notification: GooglePromptNotification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const reason = notification.isNotDisplayed()
            ? notification.getNotDisplayedReason()
            : notification.getSkippedReason();

          const error = new Error(`Google login was not shown: ${reason}`);
          setState((current) => ({
            ...current,
            loading: false,
            error: error.message,
          }));
          reject(error);
        }
      });
    });
  }, [clientId, initializeGoogleAuth]);

  const signOut = useCallback(async () => {
    const google = window.google as GoogleWindow | undefined;

    google?.accounts?.id.disableAutoSelect();

    setState((current) => ({
      ...current,
      authenticated: false,
      user: null,
      credential: null,
      error: null,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      signInWithGoogle,
      signOut,
      initializeGoogleAuth,
    }),
    [state, initializeGoogleAuth, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
export { AuthContext };
export type { AuthContextValue, GoogleProfile };
