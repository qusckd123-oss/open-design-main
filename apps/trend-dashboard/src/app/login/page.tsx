import { safeRedirectPath } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ from?: string; error?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "접근 코드가 올바르지 않습니다.",
  config: "서버 인증 설정이 완료되지 않았습니다. 관리자에게 문의하세요."
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { from, error } = await searchParams;
  const redirectTo = safeRedirectPath(from);
  const errorMessage = error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid : null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="rounded border border-line bg-white p-8 shadow-subtle">
        <p className="text-xs font-semibold text-signal">TREND DASHBOARD</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">접근 코드를 입력하세요</h1>
        <p className="mt-2 text-sm text-muted">공유받은 접근 코드로 로그인합니다.</p>

        <form className="mt-6 space-y-4" method="POST" action="/api/auth/login">
          <input type="hidden" name="from" value={redirectTo} />
          <div>
            <label htmlFor="code" className="block text-xs font-semibold text-muted">
              접근 코드
            </label>
            <input
              id="code"
              name="code"
              type="password"
              autoFocus
              autoComplete="off"
              required
              className="mt-2 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </div>
          {errorMessage ? <p className="text-sm font-semibold text-fall">{errorMessage}</p> : null}
          <button
            type="submit"
            className="w-full rounded bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
