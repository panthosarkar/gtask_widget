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

type GoogleTaskList = {
  id: string;
  title: string;
  updated?: string;
};

type GoogleTask = {
  id: string;
  title: string;
  notes?: string;
  status?: string;
  due?: string;
};

type GoogleTasksState = {
  taskLists: GoogleTaskList[];
  tasksByList: Record<string, GoogleTask[]>;
  tasksLoading: boolean;
  tasksError: string | null;
};

type AuthState = {
  loading: boolean;
  initialized: boolean;
  authenticated: boolean;
  user: GoogleProfile | null;
  accessToken: string | null;
  error: string | null;
} & GoogleTasksState;

type AuthContextValue = AuthState & {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeGoogleAuth: () => Promise<void>;
  refreshGoogleTasks: () => Promise<void>;
};

type TProps = {
  children: ReactNode;
  clientId?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  scope?: string;
  token_type?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleOAuth2 = {
  initTokenClient: (options: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
  }) => GoogleTokenClient;
  revoke: (token: string, callback: () => void) => void;
};

type GoogleIdentityService = {
  disableAutoSelect: () => void;
};

type GoogleWindow = {
  accounts: {
    id?: GoogleIdentityService;
    oauth2?: GoogleOAuth2;
  };
};

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_TASKS_SCOPE = "https://www.googleapis.com/auth/tasks.readonly";

const defaultTasksState: GoogleTasksState = {
  taskLists: [],
  tasksByList: {},
  tasksLoading: false,
  tasksError: null,
};

const defaultAuthState: AuthState = {
  loading: false,
  initialized: false,
  authenticated: false,
  user: null,
  accessToken: null,
  error: null,
  ...defaultTasksState,
};

const AuthContext = createContext<AuthContextValue>({
  ...defaultAuthState,
  signInWithGoogle: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signOut: async () => undefined,
  initializeGoogleAuth: async () => undefined,
  refreshGoogleTasks: async () => undefined,
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getGoogleAuthSetupHint(message: string) {
  if (
    /invalid_client|invalid_credentials|invalid_request|no registered origin|origin/i.test(
      message,
    ) ||
    /origin/i.test(message)
  ) {
    return (
      `${message}. Use Google OAuth Client type "Web application" ` +
      `and add Authorized JavaScript origins for this app origin, ` +
      `for example http://localhost:5173 or http://127.0.0.1:5173.`
    );
  }

  return message;
}

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
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

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const profile = await fetchJson<Record<string, unknown>>(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    accessToken,
  );

  return {
    id: String(profile.sub ?? ""),
    email: String(profile.email ?? ""),
    name: String(profile.name ?? ""),
    givenName: profile.given_name ? String(profile.given_name) : undefined,
    familyName: profile.family_name ? String(profile.family_name) : undefined,
    picture: profile.picture ? String(profile.picture) : undefined,
  };
}

async function fetchGoogleTasks(accessToken: string) {
  const listResponse = await fetchJson<{
    items?: Array<{ id: string; title: string; updated?: string }>;
  }>("https://tasks.googleapis.com/tasks/v1/users/@me/lists", accessToken);

  const taskLists = listResponse.items ?? [];
  const taskEntries = await Promise.all(
    taskLists.map(async (taskList) => {
      const taskResponse = await fetchJson<{
        items?: Array<{
          id: string;
          title: string;
          notes?: string;
          status?: string;
          due?: string;
        }>;
      }>(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
          taskList.id,
        )}/tasks?maxResults=100&showCompleted=true&showHidden=true`,
        accessToken,
      );

      return {
        listId: taskList.id,
        tasks: taskResponse.items ?? [],
      };
    }),
  );

  const tasksByList = taskEntries.reduce<Record<string, GoogleTask[]>>(
    (accumulator, entry) => {
      accumulator[entry.listId] = entry.tasks;
      return accumulator;
    },
    {},
  );

  return {
    taskLists,
    tasksByList,
  };
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

    if (!window.google?.accounts?.oauth2) {
      throw new Error("Google Identity Services not available");
    }

    setState((current) => ({
      ...current,
      initialized: true,
      error: null,
    }));
  }, [clientId]);

  const refreshGoogleTasks = useCallback(async () => {
    const accessToken = state.accessToken;

    if (!accessToken) {
      throw new Error("Missing Google access token");
    }

    setState((current) => ({
      ...current,
      tasksLoading: true,
      tasksError: null,
    }));

    try {
      const { taskLists, tasksByList } = await fetchGoogleTasks(accessToken);

      setState((current) => ({
        ...current,
        taskLists,
        tasksByList,
        tasksLoading: false,
        tasksError: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load Google Tasks";
      setState((current) => ({
        ...current,
        tasksLoading: false,
        tasksError: message,
      }));
      throw error;
    }
  }, [state.accessToken]);

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

    if (!google?.accounts?.oauth2) {
      throw new Error("Google Identity Services not available");
    }

    const oauth2 = google.accounts.oauth2;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    return new Promise<void>((resolve, reject) => {
      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_TASKS_SCOPE,
        callback: async (response: GoogleTokenResponse) => {
          if (response.error) {
            const errorMessage = getGoogleAuthSetupHint(
              response.error_description || response.error,
            );
            const error = new Error(errorMessage);
            setState((current) => ({
              ...current,
              loading: false,
              error: error.message,
            }));
            reject(error);
            return;
          }

          if (!response.access_token) {
            const error = new Error("Google did not return access token");
            setState((current) => ({
              ...current,
              loading: false,
              error: error.message,
            }));
            reject(error);
            return;
          }

          try {
            const user = await fetchGoogleProfile(response.access_token);
            const { taskLists, tasksByList } = await fetchGoogleTasks(
              response.access_token,
            );

            setState((current) => ({
              ...current,
              loading: false,
              authenticated: true,
              user,
              accessToken: response.access_token ?? null,
              error: null,
              taskLists,
              tasksByList,
              tasksLoading: false,
              tasksError: null,
            }));

            resolve();
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Unable to complete Google login";

            setState((current) => ({
              ...current,
              loading: false,
              error: message,
            }));
            reject(error);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    });
  }, [clientId, initializeGoogleAuth]);

  const signOut = useCallback(async () => {
    const accessToken = state.accessToken;
    const google = window.google as GoogleWindow | undefined;

    if (accessToken && google?.accounts?.oauth2?.revoke) {
      await new Promise<void>((resolve) => {
        google.accounts.oauth2?.revoke(accessToken, () => resolve());
      });
    }

    google?.accounts?.id?.disableAutoSelect();

    setState((current) => ({
      ...current,
      authenticated: false,
      user: null,
      accessToken: null,
      error: null,
      taskLists: [],
      tasksByList: {},
      tasksLoading: false,
      tasksError: null,
    }));
  }, [state.accessToken]);

  const value = useMemo(
    () => ({
      ...state,
      signInWithGoogle,
      signOut,
      initializeGoogleAuth,
      refreshGoogleTasks,
    }),
    [
      state,
      initializeGoogleAuth,
      refreshGoogleTasks,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
export { AuthContext };
export type { AuthContextValue, GoogleProfile, GoogleTask, GoogleTaskList };
