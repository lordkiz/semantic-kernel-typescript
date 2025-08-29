import { JsonCreator } from "../../implementations/JsonCreator"
import { JsonProperty } from "../JsonProperty"

describe("JsonProperty", () => {
  it("makes json property with property name when configurations are not provided", () => {
    class Clazz extends JsonCreator {
      @JsonProperty() public name: string = "clazzz"
    }

    expect(new Clazz().json()).toEqual({ name: "clazzz" })
  })

  it("makes json property with provided name if present", () => {
    class Clazz extends JsonCreator {
      @JsonProperty("clazz_name") public name: string = "clazzz"
    }

    expect(new Clazz().json()).toEqual({ clazz_name: "clazzz" })
  })

  it("makes json property with provided name in the options", () => {
    class Clazz extends JsonCreator {
      @JsonProperty({ name: "name_of_prop", defaultValue: "defaultName" })
      public name: string | undefined

      setName(n: string) {
        this.name = n
      }
    }

    const clazz = new Clazz()

    expect(clazz.json()).toEqual({ name_of_prop: "defaultName" })

    clazz.setName("newName")

    expect(clazz.json()).toEqual({ name_of_prop: "newName" })
  })
})
