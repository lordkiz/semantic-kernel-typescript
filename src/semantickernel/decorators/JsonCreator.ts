import { JsonUtils } from "../utils/JsonUtils";

export function JsonCreator(): ClassDecorator {
  return function (target) {
    target.prototype.json = function () {
      return JsonUtils.serialize(target);
    };
  };
}
