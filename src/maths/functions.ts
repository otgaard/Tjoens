export function clamp<T>(val: T, min: T, max: T): T {
    return val < min ? min : val > max ? max : val;
}

export function bias(val: number, bias: number): number {
    return (val / ((((1./bias) - 2.)*(1. - val))+1.));
}

export function gain(val: number, gain: number): number {
    return val < .5
        ? .5*bias(2.*val, gain)
        : .5*bias(2.*val - 1., 1. - gain) + .5;
}