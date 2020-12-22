export enum Vec4Type {
    BYTE,
    INTEGER,
    FLOAT,
}

export class vec4f extends Float32Array {
    static size = 4;
    static type = Vec4Type.FLOAT;

    public static create() {
        return new vec4f(vec4f.size);
    }

    public static set(r: vec4f, x: number, y: number, z: number, w: number): vec4f {
        r[0] = x;
        r[1] = y;
        r[2] = z;
        r[3] = w;
        return r;
    }

    public static copy(r: vec4f, u: vec4f | ArrayLike<number>): void {
        r[0] = u[0];
        r[1] = u[1];
        r[2] = u[2];
        r[3] = u[3];
    }

    public static add(r: vec4f, u: vec4f | ArrayLike<number>, v: vec4f | ArrayLike<number>): void {
        r[0] = u[0] + v[0];
        r[1] = u[1] + v[1];
        r[2] = u[2] + v[2];
        r[3] = u[3] + v[3];
    }

    public static addScalar(r: vec4f, u: vec4f | ArrayLike<number>, s: number): void {
        r[0] = u[0] + s;
        r[1] = u[1] + s;
        r[2] = u[2] + s;
        r[3] = u[3] + s;
    }

    public static sub(r: vec4f, u: vec4f | ArrayLike<number>, v: vec4f | ArrayLike<number>): void {
        r[0] = u[0] - v[0];
        r[1] = u[1] - v[1];
        r[2] = u[2] - v[2];
        r[3] = u[3] - v[3];
    }

    public static subScalar(r: vec4f, u: vec4f | ArrayLike<number>, s: number): void {
        r[0] = u[0] - s;
        r[1] = u[1] - s;
        r[2] = u[2] - s;
        r[3] = u[3] - s;
    }

    public static mul(r: vec4f, u: vec4f | ArrayLike<number>, v: vec4f | ArrayLike<number>): void {
        r[0] = u[0] * v[0];
        r[1] = u[1] * v[1];
        r[2] = u[2] * v[2];
        r[3] = u[3] * v[3];
    }

    public static mulScalar(r: vec4f, u: vec4f | ArrayLike<number>, s: number): void {
        r[0] = u[0] * s;
        r[1] = u[1] * s;
        r[2] = u[2] * s;
        r[3] = u[3] * s;
    }

    public static div(r: vec4f, u: vec4f | ArrayLike<number>, v: vec4f | ArrayLike<number>): void {
        r[0] = u[0] / v[0];
        r[1] = u[1] / v[1];
        r[2] = u[2] / v[2];
        r[3] = u[3] / v[3];
    }

    public static divScalar(r: vec4f, u: vec4f | ArrayLike<number>, s: number): void {
        r[0] = u[0] / s;
        r[1] = u[1] / s;
        r[2] = u[2] / s;
        r[3] = u[3] / s;
    }

    public static dot(u: vec4f | ArrayLike<number>, v: vec4f | ArrayLike<number>): number {
        return u[0] * v[0] + u[1] * v[1] + u[2] * v[2] + u[3] * v[3];
    }

    public static dotScalar(u: vec4f | ArrayLike<number>, x: number, y: number, z: number, w: number): number {
        return u[0] * x + u[1] * y + u[2] * z + u[3] * w;
    }

    public static lenSq(u: vec4f | ArrayLike<number>): number {
        return vec4f.dot(u, u);
    }

    public static len(u: vec4f | ArrayLike<number>): number {
        return Math.sqrt(vec4f.dot(u,u));
    }

    public x(): number {
        return (this)[0];
    }

    public y(): number {
        return (this)[1];
    }

    public z(): number {
        return (this)[2];
    }
}
