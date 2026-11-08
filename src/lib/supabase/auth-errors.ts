export const accountServiceMessages = {
  response:
    "The account service returned an invalid sign-in response. Check that the deployment uses the Supabase Project URL.",
  connection:
    "Campus Ride could not reach the account service. Please try again later.",
};

export function getAccountServiceFailure(
  error: unknown,
): keyof typeof accountServiceMessages | null {
  if (!(error instanceof Error)) return null;

  // Supabase Auth can wrap a JSON parsing failure in an SDK error.
  if (
    error instanceof SyntaxError ||
    ("originalError" in error && error.originalError instanceof SyntaxError) ||
    /unexpected token\s+['"]?</i.test(error.message) ||
    /<!doctype|<html\b/i.test(error.message)
  ) {
    return "response";
  }

  if (
    error.name === "AuthRetryableFetchError" ||
    /failed to fetch|fetch failed|networkerror|network request failed/i.test(error.message)
  ) {
    return "connection";
  }

  return null;
}
