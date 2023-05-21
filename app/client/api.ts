import { ACCESS_CODE_PREFIX } from "../constant";
import { ModelConfig, ModelType, useAccessStore } from "../store";
import { ChatGPTApi } from "./platforms/openai";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export interface RequestMessage {
  role: MessageRole;
  content: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;

  abstract usage(): Promise<LLMUsage>;
}

export class ClientApi {
  public llm: LLMApi;

  constructor() {
    this.llm = new ChatGPTApi();
  }

  config() {}

  prompts() {}

  masks() {}
}

export const api = new ClientApi();

export function getHeaders(uri: string) {
  const accessStore = useAccessStore.getState();
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const makeBearer = (token: string) => `Bearer ${token.trim()}`;
  const validString = (x: string) => x && x.length > 0;

  // use user's api key first
  /*if (validString(accessStore.token)) {
      headers.Authorization = makeBearer(accessStore.token);
    } else if (
      accessStore.enabledAccessControl() &&
      validString(accessStore.accessCode)
    ) {
      headers.Authorization = makeBearer(
        ACCESS_CODE_PREFIX + accessStore.accessCode,
      );
    }*/
  const DIGITS_LOWER = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ];
  const createSign = (
    uri: string,
    secretId: string,
    secretKey: string,
    timestamp: string,
    requestId: string,
  ) => {
    const md = crypto.createHash("sha256");
    md.update(requestId + uri + secretId + secretKey + timestamp, "utf8");
    const data = md.digest();
    const l = data.length;
    const out = new Array(l << 1);
    let j = 0;
    for (let i = 0; i < l; ++i) {
      out[j++] = DIGITS_LOWER[(240 & data[i]) >>> 4];
      out[j++] = DIGITS_LOWER[15 & data[i]];
    }
    return out.join("").substring(16, 48);
  };
  const timestamp = String(new Date().getTime());
  const requestId = uuidv4();
  const sign = createSign(
    uri,
    accessStore.secretId,
    accessStore.secretKey,
    timestamp,
    requestId,
  );
  headers.requestId = requestId;
  headers.secretId = accessStore.secretId;
  headers.timestamp = timestamp;
  headers.sign = sign;
  return headers;
}
