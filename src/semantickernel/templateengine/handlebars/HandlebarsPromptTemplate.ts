import Handlebars, { HelperDelegate, HelperOptions } from "handlebars"
import { Observable, of } from "rxjs"
import SKException from "../../exceptions/SKException"
import KernelArguments from "../../functions/KernelArguments"
import KernelFunction from "../../functions/KernelFunction"
import { PromptTemplate } from "../../functions/prompttemplate/PromptTemplate"
import PromptTemplateConfig from "../../functions/prompttemplate/PromptTemplateConfig"
import Kernel from "../../Kernel"
import FunctionResult from "../../orchestration/FunctionResult"
import InvocationContext from "../../orchestration/InvocationContext"
import ChatMessageContent from "../../services/chatcompletion/ChatMessageContent"

/**
 * A prompt template that uses the Handlebars template engine to render prompts.
 */
export default class HandlebarsPromptTemplate implements PromptTemplate {
  private promptTemplateConfig: PromptTemplateConfig

  /**
   * Initializes a new instance of the {@link HandlebarsPromptTemplate} class.
   *
   * @param promptTemplate The prompt template configuration.
   */
  constructor(promptTemplate: PromptTemplateConfig) {
    this.promptTemplateConfig = PromptTemplateConfig.fromPromptTemplateConfig(promptTemplate)
  }

  renderAsync(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    context?: InvocationContext
  ): Observable<FunctionResult<string>> {
    const template = this.promptTemplateConfig.getTemplate()
    if (!template) {
      throw new SKException(
        `No prompt template was provided for the prompt ${this.promptTemplateConfig.getName()}.`
      )
    }

    if (!context) {
      context = InvocationContext.Builder().build()
    }
    const handler = new HandleBarsPromptTemplateHandler(kernel, template, context)

    if (!kernelArguments) {
      kernelArguments = KernelArguments.Builder().build()
    }
    return of(new FunctionResult(handler.render(kernelArguments)))
  }
}

class HandleBarsPromptTemplateHandler {
  private template: string
  private invocationContext: InvocationContext
  private handlebars: typeof Handlebars

  constructor(kernel: Kernel, template: string, context: InvocationContext) {
    if (!template) {
      throw new SKException("No template supplied to HandleBarsPromptTemplateHandler")
    }
    this.template = template
    this.invocationContext = context

    this.handlebars = Handlebars.create()

    this.handlebars.registerHelper("message", this.handleMessage)

    kernel.getPlugins().forEach((plugin) => {
      plugin.getFunctions().forEach(async (kernelFunction) => {
        const fnName = kernelFunction.getMethod().name
        const instanceName = kernelFunction.getInstance()?.name ?? ""
        const helperName = instanceName + `${instanceName ? "." : ""}` + fnName

        this.handlebars.registerHelper(
          helperName,
          this.invokeFunctionForHelper(kernel, kernelFunction, this.invocationContext)
        )
      })
    })
  }

  render(kernelArguments: KernelArguments): string {
    const args: Record<string, any> = {}
    kernelArguments.forEach((v, k) => {
      args[k] = v.getValue()
    })

    return this.handlebars.compile(this.template)(args)
  }

  private handleMessage(ctx: any, opts: HelperOptions) {
    let role = opts.hash["role"]
    let content = opts.fn(ctx)

    if (!ctx) {
      const message: ChatMessageContent<string> = content as unknown as ChatMessageContent<string>

      if (message) {
        if (!role) {
          role = message.getAuthorRole()
        }
        content = message.getContent()
      }
    }

    if (role) {
      return new Handlebars.SafeString(`<message role="${role.toLowerCase()}">${content}</message>`)
    }
  }

  private invokeFunctionForHelper(
    kernel: Kernel,
    kernelFunction: KernelFunction<any>,
    _invocationContext: InvocationContext
  ): HelperDelegate {
    return (ctx, opts) => {
      const kernelArgumentsBuilder = KernelArguments.Builder()

      if (ctx instanceof KernelArguments) {
        kernelArgumentsBuilder.withVariables(ctx)
      } else {
        kernelArgumentsBuilder.withInput(ctx)
      }

      if (opts.hash[KernelArguments.MAIN_KEY]) {
        kernelArgumentsBuilder.withVariables(opts.hash)
      }

      return kernelFunction.invoke(kernel)
    }
  }
}
