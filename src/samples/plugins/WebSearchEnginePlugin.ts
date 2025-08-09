import { type WebSearchEngineConnector } from "@semantic-kernel-typescript/core/connectors"
import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { DefineKernelFunction } from "@semantic-kernel-typescript/core/functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "@semantic-kernel-typescript/core/functions/decorators/KernelFunctionParameter"
import { map, Observable } from "rxjs"

export class WebSearchEnginePlugin {
  /** The count parameter name. */
  public static COUNT_PARAM = "count"

  /** The offset parameter name. */
  public static OFFSET_PARAM = "offset"

  private readonly connector: WebSearchEngineConnector

  constructor(connector: WebSearchEngineConnector) {
    this.connector = connector
  }

  /** Performs a web search using the provided query, count, and offset. */
  @DefineKernelFunction({ name: "search", description: "Searches the web for the given query" })
  public searchAsync(
    @KernelFunctionParameter({ description: "The search query", name: "query" }) query: string,
    @KernelFunctionParameter({
      description: "The number of results to return",
      name: "count",
      defaultValue: 1,
    })
    count: number,
    @KernelFunctionParameter({
      description: "The number of results to skip",
      name: "offset",
      defaultValue: 0,
    })
    offset: number
  ): Observable<string> {
    return this.connector.searchAsync(query, count, offset).pipe(
      map((results) => {
        if (!results?.length) {
          throw new SKException("Failed to get a response from the web search engine.")
        }

        return count == 1
          ? results[0].snippet
          : JSON.stringify(results.slice(0, count).map((it) => it.snippet))
      })
    )
  }
}
