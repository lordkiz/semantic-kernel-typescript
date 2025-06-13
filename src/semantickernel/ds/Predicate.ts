export default abstract class Predicate<T> {
  abstract test(t: T): boolean;
}
