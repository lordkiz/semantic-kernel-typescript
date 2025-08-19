import {
  DefineKernelFunction,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"

export class SearchUrlPlugin {
  /** Get search URL for Amazon */
  @DefineKernelFunction({
    name: "AmazonSearchUrl",
    description: "Return URL for Amazon search query",
  })
  public AmazonSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.amazon.com/s?k=${encoded}`
  }

  /*
   * Get search URL for Bing
   */
  @DefineKernelFunction({ name: "BingSearchUrl", description: "Return URL for Bing search query." })
  public BingSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ): string {
    const encoded = encodeURIComponent(query)
    return `https://www.bing.com/search?q=${encoded}`
  }

  /** Get search URL for Bing Images */
  @DefineKernelFunction({
    name: "BingImagesSearchUrl",
    description: "Return URL for Bing Images search query.",
  })
  public BingImagesSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.bing.com/images/search?q=${encoded}`
  }

  /** Get search URL for Bing Maps */
  @DefineKernelFunction({
    name: "BingMapsSearchUrl",
    description: "Return URL for Bing Maps search query.",
  })
  BingMapsSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.bing.com/maps?q=${encoded}`
  }

  /** Get search URL for Bing Shopping */
  @DefineKernelFunction({
    name: "BingShoppingSearchUrl",
    description: "Return URL for Bing Shopping search query.",
  })
  BingShoppingSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.bing.com/shop?q=${encoded}`
  }

  /** Get search URL for Bing News */
  @DefineKernelFunction({
    name: "BingNewsSearchUrl",
    description: "Return URL for Bing News search query.",
  })
  BingNewsSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.bing.com/news/search?q=${encoded}`
  }

  /** Get search URL for Bing Travel */
  @DefineKernelFunction({
    name: "BingTravelSearchUrl",
    description: "Return URL for Bing Travel search query.",
  })
  BingTravelSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.bing.com/travel/search?q=${encoded}`
  }

  /** Get search URL for Facebook */
  @DefineKernelFunction({
    name: "FacebookSearchUrl",
    description: "Return URL for Facebook search query.",
  })
  FacebookSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.facebook.com/search/top/?q=${encoded}`
  }

  /** Get search URL for GitHub */
  @DefineKernelFunction({
    name: "GitHubSearchUrl",
    description: "Return URL for GitHub search query.",
  })
  GitHubSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://github.com/search?q=${encoded}`
  }

  /** Get search URL for LinkedIn */
  @DefineKernelFunction({
    name: "LinkedInSearchUrl",
    description: "Return URL for LinkedIn search query.",
  })
  LinkedInSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://www.linkedin.com/search/results/index/?keywords=${encoded}`
  }

  /** Get search URL for Twitter */
  @DefineKernelFunction({
    name: "TwitterSearchUrl",
    description: "Return URL for Twitter search query.",
  })
  TwitterSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://twitter.com/search?q=${encoded}`
  }

  /** Get search URL for Wikipedia */
  @DefineKernelFunction({
    name: "WikipediaSearchUrl",
    description: "Return URL for Wikipedia search query.",
  })
  WikipediaSearchUrl(
    @KernelFunctionParameter({ description: "Text to search for", name: "query", required: true })
    query: string
  ) {
    const encoded = encodeURIComponent(query)
    return `https://wikipedia.org/w/index.php?search=${encoded}`
  }

  private encode(query: string) {
    return encodeURIComponent(query)
  }
}
