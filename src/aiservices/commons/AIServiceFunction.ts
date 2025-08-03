export abstract class AIServiceFunction<ServiceFunctionDefinition> {
  private _pluginName: string
  private _name: string
  private _functionDefinition: ServiceFunctionDefinition

  constructor(name: string, pluginName: string, functionDeclaration: ServiceFunctionDefinition) {
    this._name = name
    this._pluginName = pluginName
    this._functionDefinition = functionDeclaration
  }

  get name() {
    return this._name
  }

  get pluginName() {
    return this._pluginName
  }

  get functionDefinition() {
    return this._functionDefinition
  }
}
