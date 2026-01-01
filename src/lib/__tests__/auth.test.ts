/**
 * @vitest-environment node
 */
import { test, expect, vi, beforeEach, describe } from "vitest";
import { jwtVerify } from "jose";

// Mock server-only to avoid import errors
vi.mock("server-only", () => ({}));

// Mock cookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}));

// Import after mocks are set up
const { createSession, getSession } = await import("@/lib/auth");
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sets an HTTP-only cookie named 'auth-token'", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockCookies.set).toHaveBeenCalledTimes(1);

    const [cookieName, , options] = mockCookies.set.mock.calls[0];
    expect(cookieName).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
  });

  test("sets cookie with correct security options", async () => {
    await createSession("user-123", "test@example.com");

    const options = mockCookies.set.mock.calls[0][2];
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("creates a valid JWT token", async () => {
    await createSession("user-123", "test@example.com");

    const token = mockCookies.set.mock.calls[0][1];
    expect(typeof token).toBe("string");

    // Token should be verifiable
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload).toBeDefined();
  });

  test("JWT contains userId and email in payload", async () => {
    await createSession("user-456", "hello@example.com");

    const token = mockCookies.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-456");
    expect(payload.email).toBe("hello@example.com");
  });

  test("sets cookie expiration to 7 days from now", async () => {
    const beforeCreate = Date.now();
    await createSession("user-123", "test@example.com");
    const afterCreate = Date.now();

    const options = mockCookies.set.mock.calls[0][2];
    const expiresAt = options.expires.getTime();

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    // Allow 1 second tolerance
    expect(expiresAt).toBeGreaterThanOrEqual(beforeCreate + sevenDaysMs - 1000);
    expect(expiresAt).toBeLessThanOrEqual(afterCreate + sevenDaysMs + 1000);
  });

  test("JWT has expiration claim set", async () => {
    await createSession("user-123", "test@example.com");

    const token = mockCookies.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.exp).toBeDefined();
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null when no token cookie exists", async () => {
    mockCookies.get.mockReturnValue(undefined);

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns null when cookie value is empty", async () => {
    mockCookies.get.mockReturnValue({ value: undefined });

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns session payload when valid token exists", async () => {
    const validToken = await new SignJWT({
      userId: "user-789",
      email: "valid@example.com",
      expiresAt: new Date().toISOString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    mockCookies.get.mockReturnValue({ value: validToken });

    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-789");
    expect(session?.email).toBe("valid@example.com");
  });

  test("returns null when token is invalid", async () => {
    mockCookies.get.mockReturnValue({ value: "invalid-token" });

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns null when token is expired", async () => {
    const expiredToken = await new SignJWT({
      userId: "user-expired",
      email: "expired@example.com",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("-1h") // Expired 1 hour ago
      .sign(JWT_SECRET);

    mockCookies.get.mockReturnValue({ value: expiredToken });

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns null when token is signed with wrong secret", async () => {
    const wrongSecret = new TextEncoder().encode("wrong-secret-key");
    const tokenWithWrongSecret = await new SignJWT({
      userId: "user-wrong",
      email: "wrong@example.com",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(wrongSecret);

    mockCookies.get.mockReturnValue({ value: tokenWithWrongSecret });

    const session = await getSession();

    expect(session).toBeNull();
  });
});
