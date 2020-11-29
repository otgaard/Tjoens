export enum Vec2Type {
    BYTE,
    INTEGER,
    FLOAT,
}

export class vec2f extends Float32Array {
    static size = 2;
    static type = Vec2Type.FLOAT;

    public static create() {
        return new vec2f(vec2f.size);
    }

    public static set(r: vec2f, u: number, v: number): void {
        r[0] = u;
        r[1] = v;
    }

    public static copy(r: vec2f, u: vec2f | ArrayLike<number>): void {
        r[0] = u[0];
        r[1] = u[1];
    }

    public static add(r: vec2f, u: vec2f | ArrayLike<number>, v: vec2f | ArrayLike<number>): void {
        r[0] = u[0] + v[0];
        r[1] = u[1] + v[1];
    }

    public static addScalar(r: vec2f, u: vec2f | ArrayLike<number>, s: number): void {
        r[0] = u[0] + s;
        r[1] = u[1] + s;
    }

    public static sub(r: vec2f, u: vec2f | ArrayLike<number>, v: vec2f | ArrayLike<number>): void {
        r[0] = u[0] - v[0];
        r[1] = u[1] - v[1];
    }

    public static subScalar(r: vec2f, u: vec2f | ArrayLike<number>, s: number): void {
        r[0] = u[0] - s;
        r[1] = u[1] - s;
    }

    public static mul(r: vec2f, u: vec2f | ArrayLike<number>, v: vec2f | ArrayLike<number>): void {
        r[0] = u[0] * v[0];
        r[1] = u[1] * v[1];
    }

    public static mulScalar(r: vec2f, u: vec2f | ArrayLike<number>, s: number): void {
        r[0] = u[0] * s;
        r[1] = u[1] * s;
    }

    public static div(r: vec2f, u: vec2f | ArrayLike<number>, v: vec2f | ArrayLike<number>): void {
        r[0] = u[0] / v[0];
        r[1] = u[1] / v[1];
    }

    public static divScalar(r: vec2f, u: vec2f | ArrayLike<number>, s: number): void {
        r[0] = u[0] / s;
        r[1] = u[1] / s;
    }

    public static dot(u: vec2f | ArrayLike<number>, v: vec2f | ArrayLike<number>): number {
        return u[0] * v[0] + u[1] * v[1];
    }

    public static lenSq(u: vec2f | ArrayLike<number>): number {
        return vec2f.dot(u, u);
    }

    public static len(u: vec2f | ArrayLike<number>): number {
        return Math.sqrt(vec2f.dot(u,u));
    }

    public x(): number {
        return (this)[0];
    }

    public y(): number {
        return (this)[1];
    }
}
