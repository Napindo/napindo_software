import { requestBlob, requestJson } from "../../api/client";
import { endpoints } from "../../api/endpoints";

type ApiResponse<T> = {
  success?: boolean;
  ok?: boolean;
  message?: string;
  data?: T;
  items?: T;
};

export const gabungApi = {
  list: (params?: { q?: string; page?: number; pageSize?: number }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("pageSize", String(params.pageSize));
    const query = search.toString();
    const path = query ? `${endpoints.gabung.list}?${query}` : endpoints.gabung.list;
    return requestJson<ApiResponse<any>>(path, { method: "GET" });
  },
  detail: (id: number | string) =>
    requestJson<ApiResponse<any>>(endpoints.gabung.detail(id), { method: "GET" }),
  create: (payload: Record<string, unknown>) =>
    requestJson<ApiResponse<any>>(endpoints.gabung.create, { method: "POST", json: payload }),
  update: (id: number | string, payload: Record<string, unknown>) =>
    requestJson<ApiResponse<any>>(endpoints.gabung.update(id), { method: "PUT", json: payload }),
  remove: (id: number | string) =>
    requestJson<ApiResponse<any>>(endpoints.gabung.remove(id), { method: "DELETE" }),
  sourceOptions: () =>
    requestJson<ApiResponse<any>>(endpoints.gabung.sourceOptions, { method: "GET" }),
  code1Options: () =>
    requestJson<ApiResponse<any>>(endpoints.gabung.code1Options, { method: "GET" }),
  importExcel: (payload: Record<string, unknown>) =>
    requestJson<ApiResponse<any>>(endpoints.gabung.importExcel, { method: "POST", json: payload }),
  personalPdf: async (payload: Record<string, unknown>) => {
    const blob = await requestBlob(endpoints.gabung.personalPdf, { method: "POST", json: payload });
    return blob;
  },
};
