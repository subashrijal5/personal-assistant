import { ToolInvocation } from "ai";

interface DocumentResult {
  success: boolean;
  document?: {
    id: string;
    title: string;
    content: string;
  };
  error?: string;
}

export default function AnalyseDocument({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {


  if (!toolInvocation.state || toolInvocation.state !== "result") {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600">Getting document content...</p>
      </div>
    );
  }

  const result = toolInvocation.result as DocumentResult;

  if (!result.success) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-red-600">
          Error getting document: {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <p className="text-sm text-gray-600">
        Retrieved content for {result.document?.title}. Analyzing...
      </p>
    </div>
  );
}
