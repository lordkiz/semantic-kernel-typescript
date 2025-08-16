import { PluginWithNameAndDescription } from "../../__tests__/mocks/pluginMocks"
import { KernelArguments } from "../../functions/KernelArguments"
import { KernelFunctionFactory } from "../../functions/KernelFunctionFactory"
import { FunctionInvokingEvent } from "../FnInvokeEvents"
import { FunctionInvokingHook } from "../KernelHook"
import { KernelHooks } from "../KernelHooks"

let hookExecutionMockCall = jest.fn()

class FunctionInvokingHook1 extends FunctionInvokingHook<string> {
  override execute(t: FunctionInvokingEvent<string>): FunctionInvokingEvent<string> {
    hookExecutionMockCall("hook1")
    t.getArguments()?.set("executedAt", Date.now())
    return t
  }

  override get priority() {
    return 50
  }
}

class FunctionInvokingHook2 extends FunctionInvokingHook<string> {
  override execute(t: FunctionInvokingEvent<string>): FunctionInvokingEvent<string> {
    hookExecutionMockCall("hook2")
    t.getArguments()?.set("executedAt", Date.now())
    return t
  }

  override get priority() {
    return 100
  }
}

const plugin = new PluginWithNameAndDescription()

describe("KernelHooks", () => {
  beforeEach(() => {
    hookExecutionMockCall = jest.fn()
  })

  it("can be merged", () => {
    const hook1 = new KernelHooks(new Map().set("hook1ID", new FunctionInvokingHook1()))
    const hooks2 = new KernelHooks(new Map().set("hook2ID", new FunctionInvokingHook2()))

    const mergedHooks = KernelHooks.merge(hook1, hooks2)

    expect(mergedHooks.hooks.has("hook1ID")).toBe(true)
    expect(mergedHooks.hooks.has("hook2ID")).toBe(true)
  })

  it("executes hooks in order of priority", () => {
    const hooks = new KernelHooks()

    const fnHook1 = new FunctionInvokingHook1()
    const fnHook2 = new FunctionInvokingHook2()

    hooks.addFunctionInvokingHook(fnHook1)
    hooks.addFunctionInvokingHook(fnHook2)

    hooks.executeHooks(
      new FunctionInvokingEvent(
        KernelFunctionFactory.createFromMethod(plugin.sqrt, plugin).build(),
        KernelArguments.Builder().build()
      )
    )

    // hook2 has a priority of 100, hook1 50. So hook2 is called first
    expect(hookExecutionMockCall.mock.calls).toEqual([["hook2"], ["hook1"]])
  })
})
