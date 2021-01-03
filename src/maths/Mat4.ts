import {vec3f} from "./Vec3";
import {eq} from "./functions";

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

    public static makePerspective(fov: number, AR: number, dMin: number, dMax: number): mat4 {
        const m = mat4.create();
        const halfTanFOV = Math.tan(fov * Math.PI/360.);

        m[mat4.idx(0, 0)] = 1. / (AR * halfTanFOV);
        m[mat4.idx(1,1)] = 1. / halfTanFOV;
        m[mat4.idx(2,2)] = dMax / (dMin - dMax);
        m[mat4.idx(2,3)] = -(dMin * dMax) / (dMax - dMin);
        m[mat4.idx(3,2)] = -1;
        return m;
    }

    public static makeTranslation(x: number, y: number, z: number): mat4 {
        const result = mat4.makeIdentity();
        result[mat4.idx(0, 3)] = x;
        result[mat4.idx(1, 3)] = y;
        result[mat4.idx(2, 3)] = z;
        return result;
    }

    public static translate(mat: mat4, x: number, y: number, z: number): mat4 {
        mat[mat4.idx(0, 3)] = x;
        mat[mat4.idx(1, 3)] = y;
        mat[mat4.idx(2, 3)] = z;
        return mat;
    }

    public static makeIdentity(): mat4 {
        const result = mat4.create();
        result[mat4.idx(0, 0)] = 1;
        result[mat4.idx(1,1)] = 1;
        result[mat4.idx(2,2)] = 1;
        result[mat4.idx(3,3)] = 1;
        return result;
    }

    public static makeRotation(axis: vec3f | ArrayLike<number>, theta: number): mat4 {
        if(!eq(vec3f.len(axis), 1.)) {
            console.log("Warning, input axis to makeRotation should be unit length");
            axis = vec3f.normalise(axis);
        }

        const [cosTheta, sinTheta, t] = [Math.cos(theta), Math.sin(theta), 1. - Math.cos(theta)];
        const [tx, ty, tz] = [t*axis[0], t*axis[1], t*axis[2]];
        const [sx, sy, sz] = [sinTheta*axis[0], sinTheta*axis[1], sinTheta*axis[2]];
        const [txy, tyz, txz] = [tx*axis[1], ty*axis[2], tx*axis[2]];

        const r = mat4.create();
        mat4.set(r,0,0,tx*axis[0] + cosTheta);
        mat4.set(r,0,1,txy + sz);
        mat4.set(r,0,2,txz - sy);
        mat4.set(r,1,0,txy - sz);
        mat4.set(r,1,1,ty*axis[1] + cosTheta);
        mat4.set(r,1,2,tyz + sx);
        mat4.set(r,2,0,txz + sy);
        mat4.set(r,2,1,tyz - sx);
        mat4.set(r,2,2,tz*axis[2] + cosTheta);
        mat4.set(r,3,3,1.);
        return r;
    }

    public static rotate(mat: mat4, axis: vec3f | ArrayLike<number>, theta: number): mat4 {
        if(!eq(vec3f.len(axis), 1.)) {
            console.log("Warning, input axis to makeRotation should be unit length");
            axis = vec3f.normalise(axis);
        }

        const [cosTheta, sinTheta, t] = [Math.cos(theta), Math.sin(theta), 1. - Math.cos(theta)];
        const [tx, ty, tz] = [t*axis[0], t*axis[1], t*axis[2]];
        const [sx, sy, sz] = [sinTheta*axis[0], sinTheta*axis[1], sinTheta*axis[2]];
        const [txy, tyz, txz] = [tx*axis[1], ty*axis[2], tx*axis[2]];

        mat4.set(mat,0,0,tx*axis[0] + cosTheta);
        mat4.set(mat,0,1,txy + sz);
        mat4.set(mat,0,2,txz - sy);
        mat4.set(mat,1,0,txy - sz);
        mat4.set(mat,1,1,ty*axis[1] + cosTheta);
        mat4.set(mat,1,2,tyz + sx);
        mat4.set(mat,2,0,txz + sy);
        mat4.set(mat,2,1,tyz - sx);
        mat4.set(mat,2,2,tz*axis[2] + cosTheta);
        return mat;
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