import { JsonProperty } from "../../decorators/JsonProperty"
import { JsonCreator } from "../JsonCreator"

class Jsonable extends JsonCreator {
  @JsonProperty("property_one") propertyOne: string = "property-one"
  @JsonProperty({ name: "property_two", defaultValue: "propertyTwo DefaultValue" }) propertyTwo:
    | string
    | undefined
  @JsonProperty("property_three") propertyThree: string[] = ["property-three"]
  @JsonProperty("property_four") propertyFour = new NestedJsonable()
}

class NestedJsonable extends JsonCreator {
  @JsonProperty("nested_property_one") propertyOne: string = "nested-property-one"
  @JsonProperty({ name: "nested_property_two", defaultValue: "nested propertyTwo DefaultValue" })
  propertyTwo: string | undefined
}

describe("JsonCreator", () => {
  it("populates default values", () => {
    expect(new Jsonable().propertyTwo).toBeUndefined()
    expect(new Jsonable().json()["property_two"]).toBe(
      "propertyTwo DefaultValue" // populates with default value
    )
  })

  it("nests json", () => {
    expect(new Jsonable().json()["property_four"]).toStrictEqual({
      // can handle nested class
      nested_property_one: "nested-property-one",
      nested_property_two: "nested propertyTwo DefaultValue",
    })
  })

  it("maintains array", () => {
    expect(new Jsonable().json()["property_three"]).toEqual(["property-three"])
  })
})
