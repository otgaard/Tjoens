export class mat4 extends Float32Array {
    static size = 16;

    public static create() {
        return new mat4(mat4.size);
    }

    public static idx(row: number, col: number): number {
        return 4*col + row;
    }

    public static set(mat: mat4, row: number, col: number, value: number): void {
        mat[mat4.idx(row, col)] = value;
    }

    public get(row: number, col: number): number {
        return (this)[mat4.idx(row, col)];
    }

    public static makePerspective(fov: number, ar: number, dMin: number, dMax: number): mat4 {
        const m = mat4.create();
        const half_rad_tan = Math.tan(fov * Math.PI/360.);

        m[mat4.idx(0, 0)] = 1. / (ar * half_rad_tan);
        m[mat4.idx(1,1)] = 1. / half_rad_tan;
        m[mat4.idx(2,2)] = dMax / (dMin - dMax);
        m[mat4.idx(2,3)] = -(dMin * dMax) / (dMax - dMin);
        m[mat4.idx(3,2)] = -1;
        m[mat4.idx(3, 3)] = 1;
        return m;
    }

    public static makeTranslation(x: number, y: number, z: number): mat4 {
        const result = mat4.makeIdentity();
        result[mat4.idx(0, 3)] = x;
        result[mat4.idx(1, 3)] = y;
        result[mat4.idx(2, 3)] = z;
        return result;
    }

    public static makeIdentity(): mat4 {
        const result = mat4.create();
        result[mat4.idx(0, 0)] = 1;
        result[mat4.idx(1,1)] = 1;
        result[mat4.idx(2,2)] = 1;
        result[mat4.idx(3,3)] = 1;
        return result;
    }

    public static mul(result: mat4, a: mat4, b: mat4) {
        mat4.set(result, 0,0, a.get(0,0)*b.get(0,0) +
            a.get(0,1)*b.get(1,0) + a.get(0,2)*b.get(2,0) +
            a.get(0,3)*b.get(3,0));
        mat4.set(result, 0,1, a.get(0,0)*b.get(0,1) +
            a.get(0,1)*b.get(1,1) + a.get(0,2)*b.get(2,1) +
            a.get(0,3)*b.get(3,1));
        mat4.set(result, 0,2, a.get(0,0)*b.get(0,2) +
            a.get(0,1)*b.get(1,2) + a.get(0,2)*b.get(2,2) +
            a.get(0,3)*b.get(3,2));
        mat4.set(result, 0,3, a.get(0,0)*b.get(0,3) +
            a.get(0,1)*b.get(1,3) + a.get(0,2)*b.get(2,3) +
            a.get(0,3)*b.get(3,3));
        mat4.set(result, 1,0, a.get(1,0)*b.get(0,0) +
            a.get(1,1)*b.get(1,0) + a.get(1,2)*b.get(2,0) +
            a.get(1,3)*b.get(3,0));
        mat4.set(result, 1,1, a.get(1,0)*b.get(0,1) +
            a.get(1,1)*b.get(1,1) + a.get(1,2)*b.get(2,1) +
            a.get(1,3)*b.get(3,1));
        mat4.set(result, 1,2, a.get(1,0)*b.get(0,2) +
            a.get(1,1)*b.get(1,2) + a.get(1,2)*b.get(2,2) +
            a.get(1,3)*b.get(3,2));
        mat4.set(result, 1,3, a.get(1,0)*b.get(0,3) +
            a.get(1,1)*b.get(1,3) + a.get(1,2)*b.get(2,3) +
            a.get(1,3)*b.get(3,3));
        mat4.set(result, 2,0, a.get(2,0)*b.get(0,0) +
            a.get(2,1)*b.get(1,0) + a.get(2,2)*b.get(2,0) +
            a.get(2,3)*b.get(3,0));
        mat4.set(result, 2,1, a.get(2,0)*b.get(0,1) +
            a.get(2,1)*b.get(1,1) + a.get(2,2)*b.get(2,1) +
            a.get(2,3)*b.get(3,1));
        mat4.set(result, 2,2, a.get(2,0)*b.get(0,2) +
            a.get(2,1)*b.get(1,2) + a.get(2,2)*b.get(2,2) +
            a.get(2,3)*b.get(3,2));
        mat4.set(result, 2,3, a.get(2,0)*b.get(0,3) +
            a.get(2,1)*b.get(1,3) + a.get(2,2)*b.get(2,3) +
            a.get(2,3)*b.get(3,3));
        mat4.set(result, 3,0, a.get(3,0)*b.get(0,0) +
            a.get(3,1)*b.get(1,0) + a.get(3,2)*b.get(2,0) +
            a.get(3,3)*b.get(3,0));
        mat4.set(result, 3,1, a.get(3,0)*b.get(0,1) +
            a.get(3,1)*b.get(1,1) + a.get(3,2)*b.get(2,1) +
            a.get(3,3)*b.get(3,1));
        mat4.set(result, 3,2, a.get(3,0)*b.get(0,2) +
            a.get(3,1)*b.get(1,2) + a.get(3,2)*b.get(2,2) +
            a.get(3,3)*b.get(3,2));
        mat4.set(result, 3,3, a.get(3,0)*b.get(0,3) +
            a.get(3,1)*b.get(1,3) + a.get(3,2)*b.get(2,3) +
            a.get(3,3)*b.get(3,3));
        return result;
    }
}