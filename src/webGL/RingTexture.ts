/*
The RingTexture provides a way to output a scrolling texture generated a row at a time in the update cycle of the
module system.  The texture will allow scrolling effects in the modules and allow the FFT and minMaxAvg values to be
packed into a convenient texture.  In addition, this removes the requirement for using *all* the available uniform
vectors and should be fast enough to work on tablets too.  Finally, the texture can be interpreted as a spectrogram in
channel 0.
*/

enum DIMS {
    WIDTH,
    HEIGHT,
    CHANNEL,
}

export class RingTexture {
    //@ts-ignore
    private gl: WebGLRenderingContext;
    private dims = new Uint16Array(3);      // [ width, height, channels ]
    private rowStride: number = 0;
    private tex: WebGLTexture | null = null;
    private format: GLenum = WebGLRenderingContext.NONE;
    private currRow: number = 0;

    // Width, height, channels
    public constructor(dims: ArrayLike<number>) {
        if(dims.length === 3) {
            this.dims.set(dims);
            this.rowStride = dims[DIMS.CHANNEL] * dims[DIMS.WIDTH];
            switch(dims[DIMS.CHANNEL]) {
                case 1: this.format = WebGLRenderingContext.LUMINANCE; break;
                case 2: this.format = WebGLRenderingContext.LUMINANCE_ALPHA; break;
                case 3: this.format = WebGLRenderingContext.RGB; break;
                case 4: this.format = WebGLRenderingContext.RGBA; break;
                default: console.error("RingTexture supports min 1, max 4 channels");
            }
        } else {
            console.error("RingTexture expects [width, height, channels]");
        }
    }

    public initialise(gl: WebGLRenderingContext): boolean {
        this.gl = gl;

        this.tex = gl.createTexture();
        if(this.tex == null) {
            console.error("Texture creation failed");
        }

        this.bind(0);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            this.format,
            this.dims[DIMS.WIDTH],
            this.dims[DIMS.HEIGHT],
            0,
            this.format,
            gl.UNSIGNED_BYTE,
            null
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // Repeat doesn't work do-it-yourself
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        this.release();

        return gl.getError() === this.gl.NO_ERROR;
    }

    public destroy(): void {
        if(this.tex) this.gl.deleteTexture(this.tex);
    }

    public getWidth(): number { return this.dims[DIMS.WIDTH]; }
    public getHeight(): number { return this.dims[DIMS.HEIGHT]; }
    public getChannels(): number { return this.dims[DIMS.CHANNEL]; }
    public getCurrentRow(): number { return this.currRow; }

    public bind(unit?: number) {
        if(unit != null) this.gl.activeTexture(this.gl.TEXTURE0+unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
    }

    public release() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public advanceRow(buffer: Uint8Array): boolean {
        if(buffer.length !== this.rowStride) {
            console.log("buffer:", buffer.length, this.rowStride);
            return false;
        }

        this.bind();

        const gl = this.gl;

        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            this.currRow,
            this.dims[DIMS.WIDTH],
            1,
            this.format,
            gl.UNSIGNED_BYTE,
            buffer
        );

        this.release();

        this.currRow = (this.currRow + 1) % this.dims[DIMS.HEIGHT];

        return gl.getError() === gl.NO_ERROR;
    }
}
