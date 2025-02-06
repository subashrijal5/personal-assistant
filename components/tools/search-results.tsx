import { ToolInvocation } from "ai";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

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
  const t = useTranslations("SearchResults");
  const results: SearchResponse =
    toolInvocation.state === "result" ? toolInvocation.result : { items: [] };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          {toolInvocation.state !== "result" && (
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h3>
      </div>

      {/* Loading or Status Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex space-x-1">
          {toolInvocation.state !== "result" && [
            "bg-blue-500",
            "bg-blue-400",
            "bg-blue-300",
          ].map((color, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${color} animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {toolInvocation.state === "result"
            ? t("completed")
            : t("searching")}
        </p>
      </div>

      {/* Results */}
      {toolInvocation.state === "result" && (
        <div className="space-y-4">
          {results.items && results.items.length > 0 ? (
            results.items.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {result.displayLink}
                  </div>
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                      {result.title}
                    </h3>
                  </a>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {result.snippet}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("noResults")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
