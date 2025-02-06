import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const awaitedSearchParams = await searchParams;
  const errorMessages = {
    no_code: 'No authorization code was received from Google.',
    no_refresh_token:
      'No refresh token was received. Please try again and make sure to approve all permissions.',
    token_exchange_failed:
      'Failed to exchange the authorization code for tokens. Please try again.',
    default: 'An unknown error occurred during authentication.',
  };

  const errorMessage =
    errorMessages[awaitedSearchParams.error as keyof typeof errorMessages] ||
    errorMessages.default;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="mb-4 text-red-500">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <div className="space-y-4">
          <Button asChild variant="default">
            <Link href="/api/auth/google">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="ml-4">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
