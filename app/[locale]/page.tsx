import { ChatProvider } from "@/components/chat-context";
import { FullPageChat } from "@/components/full-page-chat";
import { checkGoogleAuth } from "@/lib/auth-utils";
import { AuthGate } from "@/components/auth-gate";

export default async function Home() {
  const { isAuthenticated } = await checkGoogleAuth();

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <ChatProvider>
      <FullPageChat />
    </ChatProvider>
  );
}
