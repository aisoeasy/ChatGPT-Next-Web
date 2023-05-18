import { NextRequest } from "next/server";

const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;

export async function requestOpenai(req: NextRequest) {
  //const authValue = req.headers.get("Authorization") ?? "";
  const secretId = req.headers.get("secretId") ?? "";
  const timestamp = req.headers.get("timestamp") ?? "";
  const requestId = req.headers.get("requestId") ?? "";
  const sign = req.headers.get("sign") ?? "";
  const openaiPath = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/openai/",
    "",
  );

  let baseUrl = BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }

  console.log("[Proxy] ", openaiPath);
  console.log("[Base Url]", baseUrl);

  if (process.env.OPENAI_ORG_ID) {
    console.log("[Org ID]", process.env.OPENAI_ORG_ID);
  }

  return fetch(`${baseUrl}/${openaiPath}`, {
    /*headers: {
      "Content-Type": "application/json",
      Authorization: authValue,
      ...(process.env.OPENAI_ORG_ID && {
        "OpenAI-Organization": process.env.OPENAI_ORG_ID,
      }),
    },*/
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Content-Encoding": "utf-8",
      secretId: secretId,
      timestamp: timestamp,
      requestId: requestId,
      sign: sign,
    },
    cache: "no-store",
    method: req.method,
    body: req.body,
  });
}
