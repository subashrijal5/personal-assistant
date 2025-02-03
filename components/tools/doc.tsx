import { ToolInvocation } from "ai";
import { FileText, AlertCircle, Check, ExternalLink } from "lucide-react";
import { useChatContext } from "../chat-context";

interface Doc {
  id: string;
  title: string;
  link: string;
  webViewLink?: string;
  name?: string;
}

export default function Doc({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  if (!toolInvocation.state || toolInvocation.state !== "result") {
    return <div>Loading...</div>;
  }

  const isCreate = toolInvocation.toolName === "createDoc";

  const isList = toolInvocation.toolName === "listDocs";
  const isUpdate = toolInvocation.toolName === "updateDoc";

  let content;

  if (isCreate && toolInvocation.result?.doc) {
    const doc = toolInvocation.result.doc as Doc;
    content = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Document Created</h2>
        </div>
        <DocCard doc={doc} />
      </div>
    );
  } else if (isList && Array.isArray(toolInvocation.result)) {
    const docs = toolInvocation.result as Doc[];
    content = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Recent Documents</h2>
        </div>
        {docs.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-gray-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            No documents found
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <DocCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    );
  } else if (isUpdate && toolInvocation.result?.success) {
    content = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Check className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Document Updated</h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">
            The document has been updated successfully.
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="flex items-center justify-center p-6 text-gray-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        No document data available
      </div>
    );
  }

  return <div className="p-4">{content}</div>;
}

function DocCard({ doc }: { doc: Doc }) {
  const { setInput } = useChatContext();

  const handleDocClick = () => {
    setInput(
      `Use the getDocContent tool to fetch this document (ID: ${doc.id})`
    );
  };

  return (
    <div
      onClick={handleDocClick}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
            {doc.title ?? doc.name}
          </h3>
        </div>
        <a
          href={doc.link ?? doc.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking the link
        >
          <ExternalLink className="w-4 h-4" />
          Open in new tab
        </a>
      </div>
      <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
        Click to get an overview of this document
      </div>
    </div>
  );
}
