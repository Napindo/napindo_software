import { requestJson } from "../../api/client";
import { endpoints } from "../../api/endpoints";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message: string;
};

type LoginPayload = {
  username: string;
  password: string;
  division?: string | null;
};

type LoginUser = {
  username: string;
  division?: string | null;
  status?: string | null;
};

type WebLoginResult = {
  success: boolean;
  message?: string;
  user?: {
    username: string;
    division?: string | null;
    name?: string | null;
  };
};

type HintsResult = {
  success: boolean;
  message?: string;
  hints?: {
    usernames: string[];
    divisions: string[];
  };
};

export const penggunaApi = {
  login: async (payload: LoginPayload): Promise<WebLoginResult> => {
    try {
      const response = await requestJson<ApiResponse<LoginUser>>(endpoints.pengguna.login, {
        method: "POST",
        json: payload,
      });

      if (!response.ok) {
        return { success: false, message: response.message };
      }

      return {
        success: true,
        message: response.message,
        user: {
          username: response.data.username,
          division: response.data.division ?? null,
          name: response.data.username,
        },
      };
    } catch (error: any) {
      return { success: false, message: error?.message ?? "Login gagal" };
    }
  },
  hints: async (): Promise<HintsResult> => {
    try {
      const response = await requestJson<ApiResponse<any>>(endpoints.pengguna.list, {
        method: "GET",
      });

      if (!response.ok) {
        return { success: false, message: response.message };
      }

      const items: Array<{ username?: string | null; division?: string | null }> =
        Array.isArray(response.data?.items)
          ? response.data.items
          : Array.isArray(response.data)
          ? response.data
          : [];

      const usernames = Array.from(
        new Set(items.map((item) => String(item?.username || "").trim()).filter(Boolean)),
      );

      const divisions = Array.from(
        new Set(items.map((item) => String(item?.division || "").trim()).filter(Boolean)),
      );


      return { success: true, hints: { usernames, divisions } };
    } catch (error: any) {
      return { success: false, message: error?.message ?? "Gagal memuat hints" };
    }
  },
};
