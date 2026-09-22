const SOCKET_ERROR_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]);
const ADAPTER_CONNECTION_KINDS = new Set(["DatabaseNotReachable", "ConnectionClosed", "SocketTimeout"]);

export const TRANSIENT_DB_READ_RETRY_DELAY_MS = 1_000;

type RetryOptions = {
  delay?: (milliseconds: number) => Promise<void>;
  onRetry?: (errorType: string, attempt: number) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getTransientConnectionErrorType(error: unknown): string | null {
  const visited = new Set<object>();
  let current: unknown = error;

  // Prisma may wrap the adapter error, but the adapter-specific marker and
  // its structured cause remain the only accepted wrapper shape.
  for (let depth = 0; depth < 6 && isRecord(current) && !visited.has(current); depth += 1) {
    visited.add(current);

    if (
      typeof current.code === "string" &&
      SOCKET_ERROR_CODES.has(current.code) &&
      typeof current.syscall === "string" &&
      typeof current.errno === "number"
    ) {
      return current.code;
    }

    // Prisma 6.19.3 surfaces PrismaPg's structured connection errors as
    // P2010 with meta.code="N/A" and these adapter-generated messages. P2010
    // alone (or an arbitrary SQL error message) is deliberately insufficient.
    if (current.name === "PrismaClientKnownRequestError" && current.code === "P2010") {
      const meta = current.meta;
      if (isRecord(meta) && meta.code === "N/A" && typeof meta.message === "string") {
        if (meta.message === "Server has closed the connection.") return "ConnectionClosed";
        if (meta.message === "Socket timeout" || meta.message === "Socket timeout.") return "SocketTimeout";
        if (/^Database not reachable: .+:\d+$/.test(meta.message)) return "DatabaseNotReachable";
      }
    }

    const cause = current.cause;
    if (
      current.name === "DriverAdapterError" &&
      isRecord(cause) &&
      typeof cause.kind === "string" &&
      ADAPTER_CONNECTION_KINDS.has(cause.kind)
    ) {
      return cause.kind;
    }

    current = cause;
  }

  return null;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Retry a server-side READ bundle once when PrismaPg positively identifies a
 * transient connection-establishment failure. Never use for mutations.
 */
export async function withTransientDbReadRetry<T>(
  read: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    const errorType = getTransientConnectionErrorType(error);
    if (!errorType) throw error;

    (options.onRetry ?? ((type, attempt) => {
      console.warn("[db-read-retry] transient connection error; retrying once", { type, attempt });
    }))(errorType, 1);

    await (options.delay ?? sleep)(TRANSIENT_DB_READ_RETRY_DELAY_MS);
    return read();
  }
}
