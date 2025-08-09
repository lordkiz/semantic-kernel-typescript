/* eslint-disable no-useless-escape */
/**
 * Split text in chunks, attempting to leave meaning intact. For plain text, split looking at new
 * lines first, then periods, and so on. For markdown, split looking at punctuation first, and so
 * on.
 */
export class TextChunker {
  private static readonly spaceChar = " "
  private static readonly plaintextSplitOptions = [
    /[\n\r]/,
    /\./,
    /[\?\!]/,
    /;/,
    /:/,
    /,/,
    /[\)\]\}]/,
    / /,
    /\-/,
    null,
  ]

  private static readonly markdownSplitOptions = [
    /\./,
    /[\?\!]/,
    /;/,
    /:/,
    /,/,
    /[\)\]\}]/,
    / /,
    /\-/,
    /[\n\r]/,
    null,
  ]

  /**
   * Split plain text into lines
   * @param text Text to split
   * @param maxTokensPerLine Maximum number of tokens per line
   * @returns List of lines
   */
  public static splitPlainTextLines(text: string, maxTokensPerLine: number): string[] {
    return this.internalSplitLines(text, maxTokensPerLine, true, this.plaintextSplitOptions)
  }

  /**
   * Split markdown text into lines
   * @param text Text to split
   * @param maxTokensPerLine Maximum number of tokens per line
   * @returns List of lines
   */
  public static splitMarkDownLines(text: string, maxTokensPerLine: number): string[] {
    return this.internalSplitLines(text, maxTokensPerLine, true, this.markdownSplitOptions)
  }

  /**
   * Split plain text into paragraphs
   * @param lines Lines of text
   * @param maxTokensPerParagraph Maximum number of tokens per paragraph.
   * @returns List of paragraphs
   */
  public static splitPlainTextParagraphs(lines: string[], maxTokensPerParagraph: number): string[] {
    return this.internalSplitTextParagraphs(lines, maxTokensPerParagraph, (text) =>
      this.internalSplitLines(text, maxTokensPerParagraph, false, this.plaintextSplitOptions)
    )
  }

  /**
   * Split markdown text into paragraphs
   * @param lines Lines of text
   * @param maxTokensPerParagraph Maximum number of tokens per paragraph
   * @returns List of paragraphs
   */
  public static splitMarkdownParagraphs(lines: string[], maxTokensPerParagraph: number): string[] {
    return this.internalSplitTextParagraphs(lines, maxTokensPerParagraph, (text) =>
      this.internalSplitLines(text, maxTokensPerParagraph, false, this.markdownSplitOptions)
    )
  }

  private static internalSplitTextParagraphs(
    lines: string[],
    maxTokensPerParagraph: number,
    longLinesSplitter: (text: string) => string[]
  ): string[] {
    if (lines.length === 0) {
      return []
    }

    // Split long lines first
    const truncatedLines: string[] = []
    for (const line of lines) {
      truncatedLines.push(...longLinesSplitter(line))
    }

    lines = truncatedLines

    // Group lines in paragraphs
    const paragraphs: string[] = []
    let currentParagraph = ""

    for (const line of lines) {
      // "+1" to account for the "new line" added by AppendLine()
      if (
        currentParagraph.length > 0 &&
        this.tokenCount(currentParagraph.length) + this.tokenCount(line.length) + 1 >=
          maxTokensPerParagraph
      ) {
        paragraphs.push(currentParagraph.trim())
        currentParagraph = ""
      }

      currentParagraph += line + "\n"
    }

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.trim())
    }

    // distribute text more evenly in the last paragraphs when the last paragraph is too short.
    if (paragraphs.length > 1) {
      const lastParagraph = paragraphs[paragraphs.length - 1]
      const secondLastParagraph = paragraphs[paragraphs.length - 2]

      if (this.tokenCount(lastParagraph.length) < maxTokensPerParagraph / 4) {
        const lastParagraphTokens = lastParagraph.split(this.spaceChar).filter((it) => it !== "")
        const secondLastParagraphTokens = secondLastParagraph
          .split(this.spaceChar)
          .filter((it) => it !== "")

        const lastParagraphTokensCount = lastParagraphTokens.length
        const secondLastParagraphTokensCount = secondLastParagraphTokens.length

        if (lastParagraphTokensCount + secondLastParagraphTokensCount <= maxTokensPerParagraph) {
          let newSecondLastParagraph = ""
          for (let i = 0; i < secondLastParagraphTokensCount; i++) {
            if (newSecondLastParagraph.length !== 0) {
              newSecondLastParagraph += " "
            }
            newSecondLastParagraph += secondLastParagraphTokens[i]
          }

          for (let i = 0; i < lastParagraphTokensCount; i++) {
            if (newSecondLastParagraph.length !== 0) {
              newSecondLastParagraph += " "
            }
            newSecondLastParagraph += lastParagraphTokens[i]
          }

          paragraphs[paragraphs.length - 2] = newSecondLastParagraph.trim()
          paragraphs.pop()
        }
      }
    }

    return paragraphs
  }

  private static internalSplitLines(
    text: string,
    maxTokensPerLine: number,
    trim: boolean,
    splitOptions: (RegExp | null)[]
  ): string[] {
    text = text.replace(/\r?\n|\r/g, "\n")

    let result = this.split(text, maxTokensPerLine, [splitOptions[0]], trim)
    if (result.inputWasSplit) {
      for (let i = 1; i < splitOptions.length; i++) {
        result = this.splitStringArray(result.result, maxTokensPerLine, [splitOptions[i]], trim)

        if (!result.inputWasSplit) {
          break
        }
      }
    }
    return result.result
  }

  private static splitStringArray(
    input: string[],
    maxTokens: number,
    separators: (RegExp | null)[],
    trim: boolean
  ): SplitString {
    const result: string[] = []
    let modified = false
    for (const str of input) {
      const r = this.split(str, maxTokens, separators, trim)
      result.push(...r.result)
      modified ||= r.inputWasSplit
    }
    return new SplitString(modified, result)
  }

  private static indexOfAny(separators: (RegExp | null)[], input: string): number {
    const indices = separators
      .map((sep) => {
        if (sep === null) return -1
        const match = input.match(sep)
        return match ? match.index! : -1
      })
      .filter((index) => index !== -1)

    return indices.length > 0 ? Math.min(...indices) : -1
  }

  private static split(
    input: string,
    maxTokens: number,
    separators: (RegExp | null)[],
    trim: boolean
  ): SplitString {
    if (this.tokenCount(input.length) > maxTokens) {
      let inputWasSplit = true
      const half = Math.floor(input.length / 2)
      let cutPoint = -1

      if (separators.length === 1 && separators[0] === null) {
        cutPoint = half
      } else if (input.length > 2) {
        let pos = 0
        while (true) {
          const index = this.indexOfAny(separators, input.substring(pos, input.length - 1))
          if (index < 0) {
            break
          }

          const adjustedIndex = index + pos

          if (Math.abs(half - adjustedIndex) < Math.abs(half - cutPoint)) {
            cutPoint = adjustedIndex + 1
          }

          pos = adjustedIndex + 1
        }
      }

      let result = [input]

      if (cutPoint > 0) {
        let firstHalf = input.substring(0, cutPoint)
        let secondHalf = input.substring(cutPoint)
        if (trim) {
          firstHalf = firstHalf.trim()
          secondHalf = secondHalf.trim()
        }

        // Recursion
        const first = this.split(firstHalf, maxTokens, separators, trim)
        const second = this.split(secondHalf, maxTokens, separators, trim)

        result = [...first.result, ...second.result]
        inputWasSplit = first.inputWasSplit || second.inputWasSplit
      }

      return new SplitString(inputWasSplit, result)
    }

    return new SplitString(false, [input])
  }

  private static tokenCount(inputLength: number): number {
    // TODO: partitioning methods should be configurable to allow for different tokenization
    //       strategies depending on the model to be called. For now, we use an extremely rough estimate.
    return Math.floor(inputLength / 4)
  }
}

class SplitString {
  constructor(
    public readonly inputWasSplit: boolean,
    public readonly result: string[]
  ) {}
}
