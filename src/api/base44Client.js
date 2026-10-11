import { createLocalClient } from "./localClient";

const appId = import.meta.env.VITE_BASE44_APP_ID;

function createRemoteClient() {
  return import("@base44/sdk").then(async ({ createClient }) => {
    const { appParams } = await import("@/lib/app-params");
    return createClient({
      appId: appParams.appId,
      token: appParams.token,
      functionsVersion: appParams.functionsVersion,
      serverUrl: "",
      appBaseUrl: appParams.appBaseUrl,
    });
  });
}

// The uploaded app talks to Base44 when an app id is configured.
// This workspace has no Base44 login, so the same UI runs against the bundled seed.
export const base44 = appId ? await createRemoteClient() : createLocalClient();
