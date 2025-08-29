import { WebPage, WebSearchEngineConnector } from "@semantic-kernel-typescript/core/connectors"
import { JsonProperty } from "@semantic-kernel-typescript/core/decorators"
import { JsonCreator } from "@semantic-kernel-typescript/core/implementations"
import { from, lastValueFrom, map, mergeMap } from "rxjs"

type GoogleSearchResponse = {
  items: {
    title: string
    link: string
    snippet: string
  }[]
}

export class GoogleConnector implements WebSearchEngineConnector {
  static GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"

  private apiKey: string
  private programmableSearchEngineId: string

  constructor(apiKey: string, programmableSearchEngineId: string) {
    this.apiKey = apiKey
    this.programmableSearchEngineId = programmableSearchEngineId
  }

  async searchAsync(query: string, count: number, offset: number): Promise<WebPage[]> {
    if (count <= 0 || 50 <= count) {
      throw new Error("count must be between 1 and 50")
    }

    if (offset < 0) {
      throw new Error("offset must be greater than or equal to 0")
    }

    const response = fetch(this.searchUrl(query, count, offset))

    return lastValueFrom(
      from(response).pipe(
        mergeMap((it) => it.json()),

        map((googleSearchResponse) => {
          if ((googleSearchResponse as any).error) {
            throw (googleSearchResponse as any).error
          }
          return (googleSearchResponse as GoogleSearchResponse).items.map(
            (m) => new GoogleWebPage(m.title, m.link, m.snippet)
          )
        })
      )
    )
  }

  private searchUrl(query: string, count: number, offset: number) {
    return (
      `${GoogleConnector.GOOGLE_SEARCH_URL}` +
      `?q=${encodeURIComponent(query)}` +
      `&num=${count}` +
      `&start=${offset}` +
      `&cx=${this.programmableSearchEngineId}` +
      `&key=${this.apiKey}`
    )
  }
}

class GoogleWebPage extends JsonCreator implements WebPage {
  @JsonProperty("name") private _name: string
  @JsonProperty("url") private _url: string
  @JsonProperty("snippet") private _snippet: string

  constructor(name: string, url: string, snippet: string) {
    super()
    this._name = name
    this._snippet = snippet
    this._url = url
  }

  get name() {
    return this._name
  }
  get snippet() {
    return this._snippet
  }
  get url() {
    return this._url
  }
}
