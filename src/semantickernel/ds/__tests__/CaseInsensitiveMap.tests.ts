import CaseInsensitiveMap from "../CaseInsensitiveMap"

describe("CaseInsensitiveMap", () => {
  it("keys are case insensitive", () => {
    const caseInsensitiveMap: CaseInsensitiveMap<string> = new CaseInsensitiveMap()

    caseInsensitiveMap.set("MYkEY", "testKey")

    expect(caseInsensitiveMap.get("mykey")).toBe("testKey")
    expect(caseInsensitiveMap.get("myKEY")).toBe("testKey")
    expect(caseInsensitiveMap.get("MYKEY")).toBe("testKey")
  })

  describe("Aliases", () => {
    it("getOrDefault() - can get value or return a default", () => {
      const caseInsensitiveMap = new CaseInsensitiveMap<number>()

      expect(caseInsensitiveMap.getOrDefault("non-existent-key", 0)).toBe(0)
    })

    it("put - can set key", () => {
      const caseInsensitiveMap = new CaseInsensitiveMap<number>()
      caseInsensitiveMap.put("mykey", 20)

      expect(caseInsensitiveMap.get("mykey")).toBe(20)
    })

    it("putAll() - can set merge in another CaseInsensitiveMap", () => {
      const caseInsensitiveMap = new CaseInsensitiveMap<number>()
        .set("key1", 1)
        .set("key2", 2)
        .set("KEY3", 3)

      expect(Array.from(caseInsensitiveMap.keys())).toEqual(["key1", "key2", "key3"])

      const anotherCaseInsentiveMap = new CaseInsensitiveMap<number>().set("keY4", 4).set("kEy5", 5)

      caseInsensitiveMap.putAll(anotherCaseInsentiveMap)

      expect(Array.from(caseInsensitiveMap.keys())).toEqual([
        "key1",
        "key2",
        "key3",
        "key4",
        "key5",
      ])
    })
  })
})
