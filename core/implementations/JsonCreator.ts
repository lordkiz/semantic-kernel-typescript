import { JsonUtils } from "../utils/JsonUtils"

export interface JsonCreatorClass {
  json: () => object
}

export class JsonCreator implements JsonCreatorClass {
  json() {
    return JsonUtils.serialize(this)
  }
}
// export function JsonCreator(): ClassDecorator {
//   return function (target) {
//     target.prototype.json = function () {
//       return JsonUtils.serialize(target);
//     };
//   };
// }
