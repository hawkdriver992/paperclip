import { describe, expect, it } from "vitest";
import { assertAiPrivateHttpEndpointAllowed } from "./ai-private-http-endpoint-policy.js";

describe("AI private HTTP endpoint policy", () => {
  it("rejects private-LAN HTTP by default", () => {
    expect(() => assertAiPrivateHttpEndpointAllowed("http://192.168.1.154:8008/v1", "")).toThrow(
      "PAPERCLIP_AI_PRIVATE_HTTP_ENDPOINT_ALLOWLIST",
    );
  });

  it("allows only an exact operator-allowlisted private origin", () => {
    expect(() => assertAiPrivateHttpEndpointAllowed(
      "http://192.168.1.154:8008/v1",
      "http://192.168.1.154:8008",
    )).not.toThrow();
    expect(() => assertAiPrivateHttpEndpointAllowed(
      "http://192.168.1.154:8080/v1",
      "http://192.168.1.154:8008",
    )).toThrow("PAPERCLIP_AI_PRIVATE_HTTP_ENDPOINT_ALLOWLIST");
  });

  it("does not require an allowlist for HTTPS or loopback HTTP", () => {
    expect(() => assertAiPrivateHttpEndpointAllowed("https://models.example/v1", "")).not.toThrow();
    expect(() => assertAiPrivateHttpEndpointAllowed("http://127.0.0.1:8008/v1", "")).not.toThrow();
  });
});
