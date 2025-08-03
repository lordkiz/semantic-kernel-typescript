import { DefineKernelFunction } from "@semantic-kernel-typescript/core/functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "@semantic-kernel-typescript/core/functions/decorators/KernelFunctionParameter"

export default class GitHubPlugin {
  public static baseUrl = "https://api.github.com"
  private readonly token

  constructor(token: string) {
    this.token = token
  }

  @DefineKernelFunction({ name: "get_user_info", description: "Get user information from GitHub" })
  public async getUserProfileAsync() {
    return this.makeRequest("/user")
  }

  @DefineKernelFunction({
    name: "get_repo_info",
    description: "Get repository information from GitHub",
  })
  public getRepositoryAsync(
    @KernelFunctionParameter({
      name: "organization",
      description: "The name of the repository to retrieve information for",
    })
    organization: string,
    @KernelFunctionParameter({
      name: "repoName",
      description: "The name of the repository to retrieve information for",
    })
    repoName: string
  ) {
    const query = `/repos/${organization}/${repoName}`
    return this.makeRequest(query)
  }

  @DefineKernelFunction({ name: "get_issues", description: "Get issues from GitHub" })
  public getIssuesAsync(
    @KernelFunctionParameter({
      name: "organization",
      description: "The name of the organization to retrieve issues for",
    })
    organization: string,
    @KernelFunctionParameter({
      name: "repoName",
      description: "The name of the repository to retrieve issues for",
    })
    repoName: string,
    @KernelFunctionParameter({
      name: "maxResults",
      description: "The maximum number of issues to retrieve",
      required: false,
      defaultValue: 10,
    })
    maxResults: number,
    @KernelFunctionParameter({
      name: "state",
      description: "The state of the issues to retrieve",
      required: false,
      defaultValue: "open",
    })
    state: string,
    @KernelFunctionParameter({
      name: "assignee",
      description: "The assignee of the issues to retrieve",
      required: false,
    })
    assignee: string
  ) {
    let query = `/repos/${organization}/${repoName}/issues`
    query = GitHubPlugin.buildQueryString(query, "state", state)
    query = GitHubPlugin.buildQueryString(query, "assignee", assignee)
    query = GitHubPlugin.buildQueryString(query, "per_page", `${maxResults}`)

    return this.makeRequest(query)
  }

  @DefineKernelFunction({
    name: "get_issue_detail_info",
    description: "Get detail information of a single issue from GitHub",
  })
  public async getIssueDetailAsync(
    @KernelFunctionParameter({
      name: "organization",
      description: "The name of the repository to retrieve information for",
    })
    organization: string,
    @KernelFunctionParameter({
      name: "repo_name",
      description: "The name of the repository to retrieve information for",
    })
    repoName: string,
    @KernelFunctionParameter({
      name: "issue_number",
      description: "The issue number to retrieve information for",
    })
    issueNumber: number
  ) {
    const query = `/repos/${organization}/${repoName}/issues/${issueNumber}`
    return this.makeRequest(query)
  }

  private async makeRequest(query: string) {
    const json = (
      await fetch(GitHubPlugin.baseUrl + query, {
        headers: {
          "User-Agent": "request",
          Accept: "application/vnd.github+json",
          Authorization: "Bearer " + this.token,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        method: "GET",
      })
    ).json()
    const response = await json
    return response
  }

  private static buildQueryString(path: string, param: string, value: string) {
    if (!value) {
      return path
    }

    return path + (path.includes("?") ? "&" : "?") + param + "=" + value
  }
}
