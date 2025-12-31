import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import ComboField from "./ComboField";
import { useAppStore, type AppUser } from "../store/appStore";

type LoginStatus = "idle" | "loading" | "success" | "error";

type LoginForm = {
  username: string;
  password: string;
  division: string;
};

type HintsCache = {
  usernames: string[];
  divisions: string[];
};

export type AuthenticatedUser = AppUser;

const REMEMBER_KEY = "napindo-login";
const HINTS_KEY = "napindo-hints";

const capitalizeFirst = (value: string) =>
  value.replace(
    /^(\s*)([a-zA-Z])/,
    (_, spaces: string, char: string) => `${spaces}${char.toUpperCase()}`,
  );

type MarkProps = { className?: string };

const NapindoMark = ({ className }: MarkProps) => (
  <svg
    className={`napindo-icon ${className ?? ""}`}
    viewBox="0 0 160 150"
    role="presentation"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="napindoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e63946" />
        <stop offset="100%" stopColor="#9f0f0f" />
      </linearGradient>
    </defs>
    <path
      d="M10 20c0-6.6 5.4-12 12-12h16c4.4 0 8.3 2.4 10.4 6.3L80 90 51 142.5c-2.2 3.8-6.1 6.1-10.5 6.1H22c-6.6 0-12-5.4-12-12V20Z"
      fill="url(#napindoGradient)"
    />
    <path
      d="M60 20c0-6.6 5.4-12 12-12h16c4.4 0 8.3 2.4 10.4 6.3L130 90l-29 52.5c-2.2 3.8-6.1 6.1-10.5 6.1H72c-6.6 0-12-5.4-12-12V20Z"
      fill="url(#napindoGradient)"
    />
    <path
      d="M110 20c0-6.6 5.4-12 12-12h16c6.6 0 12 5.4 12 12v116.5c0 10.8-12.9 15.8-20.2 8.1l-19.3-19.6c-2.4-2.5-3.8-5.9-3.8-9.4V20Z"
      fill="url(#napindoGradient)"
    />
  </svg>
);

// ===== BRIDGE LOGIN & HINTS KE ELECTRON/API =====

async function invokeLogin(payload: {
  username: string;
  password: string;
  division?: string | null;
}) {
  const w = window as any;

  if (w.database?.login) return w.database.login(payload);
  if (w.ipcRenderer?.invoke) return w.ipcRenderer.invoke("db:login", payload);

  throw new Error(
    "Fungsi login tidak tersedia, restart aplikasi atau rebuild preload.",
  );
}

async function invokeUserHints() {
  const w = window as any;

  if (w.database?.userHints) return w.database.userHints();
  if (w.ipcRenderer?.invoke) return w.ipcRenderer.invoke("db:userHints");

  throw new Error(
    "Fungsi userHints tidak tersedia, restart aplikasi atau rebuild preload.",
  );
}

type LoginPageProps = {
  onSuccess?: (user: AuthenticatedUser) => void;
};

function LoginPage({ onSuccess }: LoginPageProps) {
  const { setUser, setGlobalMessage } = useAppStore();

  const [form, setForm] = useState<LoginForm>({
    username: "",
    password: "",
    division: "",
  });

  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");
  const [welcomeName, setWelcomeName] = useState("");
  const [showShell, setShowShell] = useState(false);

  const [hints, setHints] = useState<HintsCache>({
    usernames: [],
    divisions: [],
  });
  const [hintsError, setHintsError] = useState<string | null>(null);

  // Load remember-me + animasi
  useEffect(() => {
    const stored = localStorage.getItem(REMEMBER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<LoginForm>;
        setForm((prev) => ({
          ...prev,
          username: parsed.username ?? "",
          division: parsed.division ?? "",
        }));
      } catch {
        //
      }
    }
    const timer = setTimeout(() => setShowShell(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Load hints username/division
  useEffect(() => {
    const cached = localStorage.getItem(HINTS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Partial<HintsCache>;
        setHints({
          usernames: parsed.usernames?.filter(Boolean) ?? [],
          divisions: parsed.divisions?.filter(Boolean) ?? [],
        });
      } catch {
        //
      }
    }

    const loadHints = async () => {
      setHintsError(null);
      try {
        const response = await invokeUserHints();
        if (response?.success && response.hints) {
          const next: HintsCache = {
            usernames: response.hints.usernames?.filter(Boolean) ?? [],
            divisions: response.hints.divisions?.filter(Boolean) ?? [],
          };
          setHints(next);
          localStorage.setItem(HINTS_KEY, JSON.stringify(next));
        } else if (response) {
          setHintsError(
            response.message ?? "Gagal memuat saran username/division",
          );
        }
      } catch (error: any) {
        setHintsError(
          error?.message ?? "Gagal memuat saran username/division",
        );
      }
    };

    loadHints();
  }, []);

  // Sync remember-me
  useEffect(() => {
    if (remember) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({
          username: form.username,
          division: form.division,
        } as Partial<LoginForm>),
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, [remember, form.username, form.division]);

  const isReady =
    form.username.trim() !== "" && form.password.trim() !== "";

  const handleChange =
    (field: keyof LoginForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const value =
        field === "password" ? raw : capitalizeFirst(raw);
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isReady) {
      setStatus("error");
      setMessage("Lengkapi username dan password terlebih dahulu.");
      return;
    }

    setStatus("loading");
    setMessage("Mengecek kredensial...");

    try {
      const response = await invokeLogin({
        username: form.username.trim(),
        password: form.password,
        division: form.division.trim() || null,
      });

      if (response?.success && response.user) {
        const user: AuthenticatedUser = {
          username: response.user.username,
          name: response.user.name ?? response.user.username,
          division:
            response.user.division ??
            (form.division.trim() || null), // dikurung supaya tidak error ?? + ||
        };

        setStatus("success");
        setWelcomeName(user.name ?? user.username);
        setMessage("Login berhasil, sedang mengarahkan Anda...");

        setUser(user);
        setGlobalMessage({ type: "success", text: "Login berhasil" });
        onSuccess?.(user);
      } else {
        setStatus("error");
        const errorText =
          response?.message ??
          "Login gagal. Periksa kembali data Anda.";
        setMessage(errorText);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message ?? "Login gagal. Coba lagi.");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-10 transition duration-500 ${
        showShell ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md shadow-card rounded-3xl border border-white overflow-visible grid md:grid-cols-2">
        {/* Panel kiri (brand) */}
        <div className="bg-gradient-to-br from-white via-rose-50 to-slate-50 flex items-center justify-center p-8 md:p-10">
          <div className="flex items-center gap-6 float-soft">
            <NapindoMark className="w-28 h-28 md:w-32 md:h-32 shrink-0" />
            <div className="relative">
              <span className="block text-rose-600 text-lg font-semibold italic tagline-underline">
                Showing The Way !
              </span>
              <h1 className="text-5xl font-bold text-slate-900 mt-2">
                Napindo
              </h1>
            </div>
          </div>
        </div>

        {/* Panel kanan (form login) */}
        <div className="p-6 sm:p-8 md:p-10">
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Login System
            </h2>
            <p className="text-slate-600">
              Type your credential SQL Server to continue.
            </p>
          </header>

          <form className="space-y-4 max-w-md" onSubmit={handleSubmit}>
            <ComboField
              label="Username"
              name="username"
              value={form.username}
              placeholder="Username"
              options={hints.usernames}
              onChange={handleChange}
            />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange("password")}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              />
            </div>

            <ComboField
              label="Division"
              name="division"
              value={form.division}
              placeholder="Division"
              options={hints.divisions}
              onChange={handleChange}
            />

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-3 text-slate-700 font-semibold cursor-pointer select-none">
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    remember ? "bg-rose-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition ${
                      remember ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                  <input
                    type="checkbox"
                    className="peer absolute inset-0 opacity-0 cursor-pointer"
                    checked={remember}
                    onChange={(event) =>
                      setRemember(event.target.checked)
                    }
                  />
                </span>
                Remember me
              </label>
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  status === "loading"
                    ? "bg-amber-400"
                    : status === "success"
                    ? "bg-emerald-500"
                    : status === "error"
                    ? "bg-rose-500"
                    : "bg-slate-300"
                }`}
                aria-hidden
              />
            </div>

            {status !== "idle" && (
              <p
                className={`text-sm font-semibold rounded-xl border px-4 py-3 ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : status === "error"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {status === "success" ? `Welcome, ${welcomeName}! ` : null}
                {message}
              </p>
            )}
            {hintsError && (
              <p className="text-sm font-semibold rounded-xl border px-4 py-3 bg-rose-50 text-rose-700 border-rose-200">
                {hintsError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold tracking-wide uppercase shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={status === "loading" || !isReady}
            >
              {status === "loading" ? "Memproses..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
