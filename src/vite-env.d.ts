/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (options: {
          client_id: string;
          callback: (response: {
            credential: string;
            select_by?: string;
          }) => void;
        }) => void;
        prompt: (
          notificationCallback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
          }) => void,
        ) => void;
        disableAutoSelect: () => void;
      };
      oauth2?: {
        initTokenClient: (options: {
          client_id: string;
          scope: string;
          callback: (response: {
            access_token?: string;
            expires_in?: number;
            error?: string;
            error_description?: string;
            scope?: string;
            token_type?: string;
          }) => void;
        }) => {
          requestAccessToken: (options?: { prompt?: string }) => void;
        };
        revoke: (token: string, callback: () => void) => void;
      };
    };
  };
}
