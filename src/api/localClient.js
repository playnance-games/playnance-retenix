import seed from "../../base44/shared/seedData.json";

const OFFLINE =
  "The assistant is offline in this local preview. Player, case, and segment data still loads from the bundled seed.";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withMeta(rows, prefix) {
  return rows.map((row, index) => ({
    ...clone(row),
    id: row.id || `${prefix}_${index + 1}`,
    created_date: row.created_date || row.timestamp || row.last_seen || "2026-09-01T00:00:00.000Z",
  }));
}

const store = {
  Player: withMeta(seed.players || [], "player"),
  Segment: withMeta(seed.segments || [], "segment"),
  UseCase: withMeta(seed.cases || [], "case"),
  Settings: withMeta(seed.settings || [], "settings"),
  PlayerEvent: withMeta(seed.events || [], "event"),
  ABRun: withMeta(seed.runs || [], "run"),
  User: [],
};

let nextId = 1;

function sortItems(items, sort) {
  if (!sort || typeof sort !== "string") return items;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a?.[key] ?? "";
    const bv = b?.[key] ?? "";
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function take(items, limit) {
  const count = Number(limit);
  if (!Number.isFinite(count) || count <= 0) return items.map(clone);
  return items.slice(0, count).map(clone);
}

function matches(item, query) {
  return Object.entries(query || {}).every(([key, value]) => item?.[key] === value);
}

function entityApi(name) {
  const rows = () => {
    if (!store[name]) store[name] = [];
    return store[name];
  };

  return {
    async list(sort, limit) {
      return take(sortItems(rows(), sort), limit);
    },
    async filter(query, sort, limit) {
      return take(sortItems(rows().filter((item) => matches(item, query)), sort), limit);
    },
    async get(id) {
      const found = rows().find((item) => item.id === id);
      if (!found) {
        const error = new Error(`No ${name} with id ${id}`);
        error.status = 404;
        throw error;
      }
      return clone(found);
    },
    async create(data) {
      const record = {
        ...clone(data || {}),
        id: data?.id || `${name.toLowerCase()}_${Date.now()}_${nextId++}`,
        created_date: data?.created_date || new Date().toISOString(),
      };
      rows().push(record);
      return clone(record);
    },
    async update(id, patch) {
      const index = rows().findIndex((item) => item.id === id);
      if (index === -1) {
        const error = new Error(`No ${name} with id ${id}`);
        error.status = 404;
        throw error;
      }
      const next = { ...rows()[index], ...clone(patch || {}), id };
      rows()[index] = next;
      return clone(next);
    },
    async delete(id) {
      const before = rows().length;
      store[name] = rows().filter((item) => item.id !== id);
      return { id, deleted: store[name].length !== before };
    },
    async bulkUpdate(patches) {
      const updated = [];
      for (const patch of patches || []) {
        updated.push(await this.update(patch.id, patch));
      }
      return updated;
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return entityApi(prop);
    },
  }
);

const localUser = {
  id: "local_user",
  email: "ops@retenix.local",
  full_name: "Retenix Ops",
  role: "admin",
};

export function createLocalClient() {
  return {
    app: {
      async getPublicSettings() {
        return {
          id: "retenix-local",
          public_settings: { name: "Retenix" },
        };
      },
    },
    auth: {
      async me() {
        return { ...localUser };
      },
      logout() {},
      redirectToLogin() {
        window.location.assign("/");
      },
      async loginViaEmailPassword() {
        return { access_token: "local" };
      },
      loginWithProvider() {
        window.location.assign("/");
      },
      async resetPasswordRequest() {},
      async register() {},
      async verifyOtp() {
        return { access_token: "local" };
      },
      setToken() {},
      async resendOtp() {},
      async resetPassword() {},
    },
    entities,
    functions: {
      async invoke(_name, payload = {}) {
        const task = payload.task;
        const result = {
          summary: OFFLINE,
          answer: OFFLINE,
          action: "none",
          changes: {},
          suggestions: {},
          filters: {},
          options: [],
        };
        if (task === "chat") {
          return { data: { answer: OFFLINE, result } };
        }
        return { data: { answer: OFFLINE, result } };
      },
    },
    integrations: {
      Core: {
        async CreateFileSignedUrl({ file_uri }) {
          return { signed_url: file_uri || "" };
        },
        async UploadPrivateFile({ file }) {
          const file_uri = file ? URL.createObjectURL(file) : "";
          return { file_uri };
        },
      },
    },
  };
}
