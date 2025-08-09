import { TextChunker } from "../TextChunker"

describe("TextChunker", () => {
  describe("splitPlainTextLines", () => {
    it("can split plain Text lines", () => {
      const input = "This is a test of the emergency broadcast system. This is only a test."
      const expected = ["This is a test of the emergency broadcast system.", "This is only a test."]
      const result = TextChunker.splitPlainTextLines(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split plain text lines with comma", () => {
      const input = "This is a test, of the emergency broadcast system. This is only a test."
      const expected = [
        "This is a test,",
        "of the emergency broadcast system.",
        "This is only a test.",
      ]

      const result = TextChunker.splitPlainTextLines(input, 10)
      expect(result).toEqual(expected)
    })

    it("can split plain text lines with long string", () => {
      const input = "This is a very very very very very very long string with nothing to split on."
      const expected = [
        "This is a very very very very very very",
        "long string with nothing to split on.",
      ]

      const result = TextChunker.splitPlainTextLines(input, 10)
      expect(result).toEqual(expected)
    })

    it("can split plain text lines with long string with small token count", () => {
      const input = "This is a very very very very very very very very very very very long string."
      const expected = [
        "This is a",
        "very very",
        "very very",
        "very very",
        "very very",
        "very very",
        "very long",
        "string.",
      ]

      const result = TextChunker.splitPlainTextLines(input, 2)
      expect(result).toEqual(expected)
    })

    it("can split plain text lines with long string with no separators", () => {
      const input = "Thisisaveryveryveryveryveryverylongstringwithnothingtospliton"
      const expected = ["Thisisaveryveryveryveryveryver", "ylongstringwithnothingtospliton"]

      const result = TextChunker.splitPlainTextLines(input, 10)
      expect(result).toEqual(expected)
    })
  })

  describe("splitMarkdownParagraphs", () => {
    it("can split Markdown paragraphs", () => {
      const input = [
        "This is a test of the emergency broadcast system. This is only a test.",
        "We repeat, this is only a test. A unit test.",
      ]
      const expected = [
        "This is a test of the emergency broadcast system.",
        "This is only a test.",
        "We repeat, this is only a test. A unit test.",
      ]

      const result = TextChunker.splitMarkdownParagraphs(input, 13)
      expect(result).toEqual(expected)
    })

    it("can split Markdown paragraphs with empty input", () => {
      const input: string[] = []
      const expected: string[] = []

      const result = TextChunker.splitMarkdownParagraphs(input, 13)
      expect(result).toEqual(expected)
    })

    it("can split Markdown paragraphs on new lines", () => {
      const input: string[] = [
        "This_is_a_test_of_the_emergency_broadcast_system\r\nThis_is_only_a_test",
        "We_repeat_this_is_only_a_test\nA_unit_test",
        "A_small_note\n" +
          "And_another\r\n" +
          "And_once_again\r" +
          "Seriously_this_is_the_end\n" +
          "We're_finished\n" +
          "All_set\n" +
          "Bye\n",
        "Done",
      ]
      const expected: string[] = [
        "This_is_a_test_of_the_emergency_broadcast_system",
        "This_is_only_a_test",
        "We_repeat_this_is_only_a_test\nA_unit_test",
        "A_small_note\nAnd_another\nAnd_once_again",
        "Seriously_this_is_the_end\nWe're_finished\nAll_set\nBye Done",
      ]

      const result = TextChunker.splitMarkdownParagraphs(input, 15)
      expect(result).toEqual(expected)
    })
  })

  describe("splitPlainTextParagraphs", () => {
    it("can split text paragraphs", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system. This is only a test.",
        "We repeat, this is only a test. A unit test.",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system.",
        "This is only a test.",
        "We repeat, this is only a test. A unit test.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 13)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs evenly", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system. This is only a test.",
        "We repeat, this is only a test. A unit test.",
        "A small note. And another. And once again. Seriously, this is the end." +
          " We're finished. All set. Bye.",
        "Done.",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system.",
        "This is only a test.",
        "We repeat, this is only a test. A unit test.",
        "A small note. And another. And once again.",
        "Seriously, this is the end. We're finished. All set. Bye. Done.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs on new lines", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system\r\nThis is only a test",
        "We repeat this is only a test\nA unit test",
        "A small note\n" +
          "And another\r\n" +
          "And once again\r" +
          "Seriously this is the end\n" +
          "We're finished\n" +
          "All set\n" +
          "Bye\n",
        "Done",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system",
        "This is only a test",
        "We repeat this is only a test\nA unit test",
        "A small note\nAnd another\nAnd once again",
        "Seriously this is the end\nWe're finished\nAll set\nBye Done",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs on new punctuation", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system. This is only a test",
        "We repeat, this is only a test? A unit test",
        "A small note! And another? And once again! Seriously, this is the end." +
          " We're finished. All set. Bye.",
        "Done.",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system.",
        "This is only a test",
        "We repeat, this is only a test? A unit test",
        "A small note! And another? And once again!",
        "Seriously, this is the end.",
        "We're finished. All set. Bye.\nDone.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs on semicolons", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system; This is only a test",
        "We repeat; this is only a test; A unit test",
        "A small note; And another; And once again; Seriously, this is the end;" +
          " We're finished; All set; Bye.",
        "Done.",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system;",
        "This is only a test",
        "We repeat; this is only a test; A unit test",
        "A small note; And another; And once again;",
        "Seriously, this is the end; We're finished; All set; Bye. Done.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs on colons", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system: This is only a test",
        "We repeat: this is only a test: A unit test",
        "A small note: And another: And once again: Seriously, this is the end:" +
          " We're finished: All set: Bye.",
        "Done.",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system:",
        "This is only a test",
        "We repeat: this is only a test: A unit test",
        "A small note: And another: And once again:",
        "Seriously, this is the end: We're finished: All set: Bye. Done.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs on commas", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system, This is only a test",
        "We repeat, this is only a test, A unit test",
        "A small note, And another, And once again, Seriously, this is the end," +
          " We're finished, All set, Bye.",
        "Done.",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system,",
        "This is only a test",
        "We repeat, this is only a test, A unit test",
        "A small note, And another, And once again, Seriously,",
        "this is the end, We're finished, All set, Bye." + "\n" + "Done.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs on closing brackets", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system) This is only a test",
        "We repeat) this is only a test) A unit test",
        "A small note] And another) And once again] Seriously this is the end}" +
          " We're finished} All set} Bye.",
        "Done.",
      ]
      const expected: string[] = [
        "This is a test of the emergency broadcast system)",
        "This is only a test",
        "We repeat) this is only a test) A unit test",
        "A small note] And another) And once again]",
        "Seriously this is the end} We're finished} All set} Bye. Done.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs on hyphens", () => {
      const input: string[] = [
        "This is a test of the emergency broadcast system-This is only a test",
        "We repeat-this is only a test-A unit test",
        "A small note-And another-And once again-Seriously, this is the end-We're" +
          " finished-All set-Bye.",
        "Done.",
      ]
      const expected: string[] = [
        "This is a test of the emergency",
        "broadcast system-This is only a test",
        "We repeat-this is only a test-A unit test",
        "A small note-And another-And once again-Seriously,",
        "this is the end-We're finished-All set-Bye." + "\n" + "Done.",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })

    it("can split text paragraphs with no delimeters", () => {
      const input: string[] = [
        "Thisisatestoftheemergencybroadcastsystem",
        "Thisisonlyatest",
        "WerepeatthisisonlyatestAunittest",
        "AsmallnoteAndanotherAndonceagain",
        "SeriouslythisistheendWe'refinishedAllsetByeDoneThisOneWillBeSplitToMeetTheLimit",
      ]
      const expected: string[] = [
        "Thisisatestoftheemergencybroadcastsystem" + "\n" + "Thisisonlyatest",
        "WerepeatthisisonlyatestAunittest",
        "AsmallnoteAndanotherAndonceagain",
        "SeriouslythisistheendWe'refinishedAllse",
        "tByeDoneThisOneWillBeSplitToMeetTheLimit",
      ]

      const result = TextChunker.splitPlainTextParagraphs(input, 15)
      expect(result).toEqual(expected)
    })
  })
})
