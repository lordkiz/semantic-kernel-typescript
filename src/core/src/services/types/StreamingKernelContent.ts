import { KernelContent } from "./KernelContent";

/**
 * Base class which represents the content returned by an AI service.
 * @param <T> The type of the content.
 */
export interface StreamingKernelContent<T> extends KernelContent<T> {}
