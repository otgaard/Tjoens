export function clamp<T>(val: T, min: T, max: T): T {
    return val < min ? min : val > max ? max : val;
}
