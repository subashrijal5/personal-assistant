"use client";
import { GoogleAuthButton } from './google-auth-button';

export function AuthGate() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Personal Assistant
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in with Google to access your personal assistant
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <GoogleAuthButton />
        </div>
      </div>
    </div>
  );
}
