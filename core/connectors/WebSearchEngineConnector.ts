/**
 * Represents a web page.
 */
export interface WebPage {
  /**
   * Gets the name of the web page.
   *
   * @return The name of the web page.
   */
  get name(): string

  /**
   * Gets the URL of the web page.
   *
   * @return The URL of the web page.
   */
  get url(): string

  /**
   * Gets the snippet of the web page.
   *
   * @return The snippet of the web page.
   */
  get snippet(): string
}
/**
 * Web search engine connector interface.
 */
export interface WebSearchEngineConnector {
  /**
   * Execute a web search engine search.
   *
   * @param query  Query to search.
   * @param count  Number of results. Defaults to 1. Must be between 1 and 50.
   * @param offset Number of results to skip. Defaults to 0.
   * @return First snippet returned from search.
   */
  searchAsync(query: string, count: number, offset: number): Promise<WebPage[]>
}
