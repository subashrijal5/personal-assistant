import { ToolInvocation } from "ai";

interface SearchResult {
  title: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
}

interface SearchResponse {
  items: SearchResult[];
}

export default function SearchResults({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const results: SearchResponse =
    toolInvocation.state === "result" ? toolInvocation.result : { items: [] };

  if (!toolInvocation.state || toolInvocation.state !== "result") {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600">Searching the web...</p>
      </div>
    );
  }

  if (!results.items || results.items.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600">No results found for the given search query.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.items.map((result, index) => (
        <div
          key={index}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
        >
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-600">{result.displayLink}</div>
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <h3 className="text-lg font-medium text-blue-600 group-hover:underline">
                {result.title}
              </h3>
            </a>
            <p className="text-sm text-gray-700 mt-1">{result.snippet}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
