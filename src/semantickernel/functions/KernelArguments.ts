import CaseInsensitiveMap from "../ds/CaseInsensitiveMap";
import SKException from "../exceptions/SKException";
import PromptExecutionSettings from "./PromptExecutionSettings";

export default class KernelArguments implements Map<string, any> {
  /**
   * Default key for the main input.
   */
  static MAIN_KEY = "input";

  variables: CaseInsensitiveMap<any>;
  executionSettings: Map<string, PromptExecutionSettings>;

  constructor();
  constructor(
    variables: Map<string, any>,
    executionSettings: Map<string, PromptExecutionSettings>
  );
  constructor(
    variables?: Map<string, any>,
    executionSettings?: Map<string, PromptExecutionSettings>
  ) {
    if (variables) {
      this.variables = new CaseInsensitiveMap<any>(variables);
    } else {
      this.variables = new CaseInsensitiveMap<any>();
    }

    if (executionSettings) {
      this.executionSettings = new Map<string, PromptExecutionSettings>(
        executionSettings
      );
    } else {
      this.executionSettings = new Map<string, PromptExecutionSettings>();
    }
  }

  getExecutionSettings() {
    return Object.seal(this.executionSettings);
  }

  getInput() {
    return this.get(KernelArguments.MAIN_KEY);
  }

  clear(): void {
    throw new Error("Method not implemented.");
  }
  delete(key: string): boolean {
    throw new Error("Method not implemented.");
  }
  forEach(
    callbackfn: (value: any, key: string, map: Map<string, any>) => void,
    thisArg?: any
  ): void {
    throw new Error("Method not implemented.");
  }
  get(key: string) {
    return this.variables.get(key);
  }
  has(key: string): boolean {
    return this.variables.contains(key);
  }
  set(key: string, value: any): this {
    this.variables.putForKey(key, value);
    return this;
  }

  size: number = 0;

  entries(): MapIterator<[string, any]> {
    throw new Error("Method not implemented.");
  }
  keys(): MapIterator<string> {
    throw new Error("Method not implemented.");
  }
  values(): MapIterator<any> {
    throw new Error("Method not implemented.");
  }
  [Symbol.iterator](): MapIterator<[string, any]> {
    throw new Error("Method not implemented.");
  }
  [Symbol.toStringTag]: string = "";

  private static _Builder = {
    variablez: new Map<string, any>(),
    executionSettingz: new Map<string, PromptExecutionSettings>(),

    withInput<T>(content: T) {
      this.variablez.set(KernelArguments.MAIN_KEY, content);
      return this;
    },

    withVariable<T>(key: string, value: T) {
      this.variablez.set(key, value);
      return this;
    },

    withVariables(map: Map<string, any>) {
      map.forEach((v, k) => this.variablez.set(k, v));
      return this;
    },

    withExecutionSettingsMap(
      executionSettings: Map<string, PromptExecutionSettings>
    ) {
      executionSettings.forEach((v, k) => this.executionSettingz.set(k, v));
      return this;
    },

    withExecutionSettingsArray(
      executionSettingsArray: PromptExecutionSettings[]
    ) {
      for (const settings of executionSettingsArray) {
        const serviceId = settings.serviceId;
        if (this.executionSettingz.has(serviceId)) {
          if (serviceId === PromptExecutionSettings.DEFAULT_SERVICE_ID) {
            throw new SKException(
              `Multiple prompt execution settings with the default service id '${PromptExecutionSettings.DEFAULT_SERVICE_ID}' or no service id have been provided. Specify a single default prompt execution settings and provide a unique service id for all other instances.`
            );
          }
          throw new SKException(
            `Multiple prompt execution settings with the service id '${serviceId}' have been provided. Specify a unique service id for all instances.`
          );
        }
        this.executionSettingz.set(serviceId, settings);
      }
      return this;
    },

    withExecutionSettings(executionSettings: PromptExecutionSettings) {
      return this.withExecutionSettingsArray([executionSettings]);
    },

    build(): KernelArguments {
      return new KernelArguments(this.variablez, this.executionSettingz);
    },
  };

  static Builder(): typeof KernelArguments._Builder {
    return KernelArguments._Builder;
  }
}
