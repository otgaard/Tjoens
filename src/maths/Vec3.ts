export enum Vec3Type {
    BYTE,
    INTEGER,
    FLOAT,
}

export class vec3f extends Float32Array {
    static size = 3;
    static type = Vec3Type.FLOAT;

    public static create() {
        return new vec3f(vec3f.size);
    }

    public static set(r: vec3f, x: number, y: number, z: number): vec3f {
        r[0] = x;
        r[1] = y;
        r[2] = z;
        return r;
    }

    public static copy(r: vec3f, u: vec3f | ArrayLike<number>): void {
        r[0] = u[0];
        r[1] = u[1];
        r[2] = u[2];
    }

    public static add(r: vec3f, u: vec3f | ArrayLike<number>, v: vec3f | ArrayLike<number>): void {
        r[0] = u[0] + v[0];
        r[1] = u[1] + v[1];
        r[2] = u[2] + v[2];
    }

    public static addScalar(r: vec3f, u: vec3f | ArrayLike<number>, s: number): void {
        r[0] = u[0] + s;
        r[1] = u[1] + s;
        r[2] = u[2] + s;
    }

    public static sub(r: vec3f, u: vec3f | ArrayLike<number>, v: vec3f | ArrayLike<number>): void {
        r[0] = u[0] - v[0];
        r[1] = u[1] - v[1];
        r[2] = u[2] - v[2];
    }

    public static subScalar(r: vec3f, u: vec3f | ArrayLike<number>, s: number): void {
        r[0] = u[0] - s;
        r[1] = u[1] - s;
        r[2] = u[2] - s;
    }

    public static mul(r: vec3f, u: vec3f | ArrayLike<number>, v: vec3f | ArrayLike<number>): void {
        r[0] = u[0] * v[0];
        r[1] = u[1] * v[1];
        r[2] = u[2] * v[2];
    }

    public static mulScalar(r: vec3f, u: vec3f | ArrayLike<number>, s: number): void {
        r[0] = u[0] * s;
        r[1] = u[1] * s;
        r[2] = u[2] * s;
    }

    public static div(r: vec3f, u: vec3f | ArrayLike<number>, v: vec3f | ArrayLike<number>): void {
        r[0] = u[0] / v[0];
        r[1] = u[1] / v[1];
        r[2] = u[2] / v[2];
    }

    public static divScalar(r: vec3f, u: vec3f | ArrayLike<number>, s: number): void {
        r[0] = u[0] / s;
        r[1] = u[1] / s;
        r[2] = u[2] / s;
    }

    public static dot(u: vec3f | ArrayLike<number>, v: vec3f | ArrayLike<number>): number {
        return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    }

    public static dotScalar(u: vec3f | ArrayLike<number>, x: number, y: number, z: number): number {
        return u[0] * x + u[1] * y + u[2] * z;
    }

    public static lenSq(u: vec3f | ArrayLike<number>): number {
        return vec3f.dot(u, u);
    }

    public static len(u: vec3f | ArrayLike<number>): number {
        return Math.sqrt(vec3f.dot(u,u));
    }

    public static normalise(v: vec3f | ArrayLike<number>): vec3f {
        const len = vec3f.len(v);
        const ret = vec3f.create();
        vec3f.divScalar(ret, v, len);
        return ret;
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