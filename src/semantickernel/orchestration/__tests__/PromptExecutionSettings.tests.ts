import PromptExecutionSettings from "../PromptExecutionSettings"

describe("PromptExecutionSettings", () => {
  it("has DEFAULT_SERVICE_ID by default", () => {
    expect(new PromptExecutionSettings<any>({}).get("serviceId")).toBe(
      PromptExecutionSettings.DEFAULT_SERVICE_ID
    )
  })

  it("has resultsPerPrompt by default", () => {
    expect(new PromptExecutionSettings<any>({}).get("resultsPerPrompt")).toBe(
      PromptExecutionSettings.DEFAULT_RESULTS_PER_PROMPT
    )
  })

  it("can be built", () => {
    const promptExecutionSettings = PromptExecutionSettings.Builder<{
      description: string
      someArbitraryValue: number
    }>()
      .someArbitraryValue(21)
      .description("descriptionzzz")
      .build()

    expect(promptExecutionSettings.get("description")).toBe("descriptionzzz")
    expect(promptExecutionSettings.get("someArbitraryValue")).toBe(21)
  })

  it("toObject", () => {
    const promptExecutionSettings = PromptExecutionSettings.Builder<{
      description: string
      someArbitraryValue: number
      someComplexValue: { a: number; b: string; c: string[]; d: { a: { b: number } } }
    }>()
      .someArbitraryValue(21)
      .description("descriptionzzz")
      .someComplexValue({
        a: 10,
        b: "bee",
        c: ["one", "two"],
        d: { a: { b: 20 } },
      })
      .build()

    expect(promptExecutionSettings.toObject()).toStrictEqual({
      description: "descriptionzzz",
      someArbitraryValue: 21,
      someComplexValue: { a: 10, b: "bee", c: ["one", "two"], d: { a: { b: 20 } } },
    })
  })
})
