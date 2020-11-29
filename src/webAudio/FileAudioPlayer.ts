/*
Contains the code relevant to the file-based audio player.  For now, the whole interface is public because I'm not sure
what we might need where.

Unfortunately, this code is unsuitable for a web-based player because it loads the entire file.  It would be great for
audio editing or playing an in-memory soundtrack, but it just uses far too much memory.  It serves as a reasonable model
for sequential/random processing of playlists using a single file/url reader and using cancellation to optimise access.
*/

// @ts-ignore
window.AudioContext = (window.AudioContext || window.webkitAudioContext);

export function loadURLAudioBuffer(ctx: AudioContext, reader: FileReader, url: string, cb: (audioBuf: AudioBuffer) => void): void {
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "blob";

    req.onload = () => {
        if(req.status !== 200) return;
        loadFileAudioBuffer(ctx, reader, req.response, cb);
    };

    req.send();
}

export function loadFileAudioBuffer(ctx: AudioContext, reader: FileReader, file: File, cb: (audioBuf: AudioBuffer) => void): void {
    if(reader.readyState === FileReader.LOADING) {
        try {
            reader.abort();
        } catch(err) {
            console.log("Warning: aborted unstarted or completed I/O request");
        }
    }

    reader.onload = (ev) => {
        if(ev.target && ev.target.result) {
            ctx.decodeAudioData(ev.target.result as ArrayBuffer, cb);
        }
    };

    reader.readAsArrayBuffer(file);
}

interface CacheObject {
    trackId: number;        // The index in the playlist
    buffer: AudioBuffer;
    source: AudioBufferSourceNode;
    startTime: number;
    started: boolean;   // Has the source been started
}

function makeCacheObject(idx: number, buffer: AudioBuffer, source: AudioBufferSourceNode): CacheObject {
    return {
        trackId: idx,
        buffer,
        source,
        startTime: 0,
        started: false,
    };
}

export enum PlayerState {
    STOPPED,
    PLAYING,
    PAUSED,
}

export default class FileAudioPlayer {
    public state: PlayerState;

    public ctx: AudioContext;
    public analyser: AnalyserNode;
    public delay: DelayNode;
    public outputNodes: [GainNode, GainNode];  // 2 gain nodes, ping-ponged with sourceCache
    public syncTimeout: number = 0;
    public syncMonitor: number = 0;

    public playList: (File | string)[];
    public activeSource: number;
    public sourceCache: (CacheObject | null)[];
    public fileReader: FileReader;

    public constructor(delay: number=0., fftSize: number=1024) {
        this.ctx = new window.AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = fftSize;
        this.delay = this.ctx.createDelay(2.); // Max buffer up to 2 seconds
        this.delay.delayTime.value = delay;
        this.analyser.connect(this.delay);
        this.delay.connect(this.ctx.destination);
        this.outputNodes = [
            this.ctx.createGain(),
            this.ctx.createGain(),
        ];
        this.outputNodes[0].connect(this.analyser);
        this.outputNodes[1].connect(this.analyser);

        this.playList = new Array<File | string>();
        this.sourceCache = [null, null]; // Ping-pong cache

        this.fileReader = new FileReader(); // Only support 1 I/O request at a time

        // This is a helper function to monitor the audio player
        this.syncMonitor = setInterval(() => {
            if(this.isPlaying()) {
                const curr = this.currSource();
                if(curr) {
                    const playtime = this.ctx.currentTime - curr.startTime;
                    const remaining = curr.buffer.duration - playtime;
                    console.log(curr.trackId, (this.playList[curr.trackId] as File).name, "playtime:", playtime, "remaining:", remaining);
                }
            }
        }, 1000);

        this.state = PlayerState.STOPPED;
        this.activeSource = 0;
    }

    public getFFTSize(): number { return this.analyser.fftSize; }
    public getBinCount(): number { return this.analyser.frequencyBinCount; }
    public isStopped(): boolean { return this.state === PlayerState.STOPPED; }
    public isPlaying(): boolean { return this.state === PlayerState.PLAYING; }
    public isPaused(): boolean { return this.state === PlayerState.PAUSED; }

    private curr(): number { return this.activeSource; }
    private next(): number { return (this.activeSource + 1) % 2; }
    private currSource(): CacheObject | null { return this.sourceCache[this.curr()]; }
    private nextSource(): CacheObject | null { return this.sourceCache[this.next()]; }
    private swapSource(): void { this.activeSource = this.next(); }

    private setSource(trackId: number, cacheIdx: number, cb?: (src: CacheObject) => void): boolean {
        const callback = (audioBuf: AudioBuffer) => {
            console.log("Loading file", audioBuf.duration);
            const existing = this.sourceCache[cacheIdx];
            if(existing && existing.started) {
                existing.source.stop();
                existing.source.disconnect();
            }

            const src = makeCacheObject(trackId, audioBuf, this.ctx.createBufferSource());
            src.source.buffer = audioBuf;
            src.source.connect(this.outputNodes[cacheIdx]);
            this.sourceCache[cacheIdx] = src;

            if(cb) cb(src);
        };

        const val = this.playList[trackId];
        typeof(val) === "string"
            ? loadURLAudioBuffer(this.ctx, this.fileReader, val as string, callback)
            : loadFileAudioBuffer(this.ctx, this.fileReader, val as File, callback);

        return true;
    }

    private clearTimeout = () => {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = 0;
    }

    private queueTrack(trackId: number, switchAfterLoad=false): void {
        if(this.syncTimeout !== 0) this.clearTimeout();

        const next = this.nextSource();
        if(next && next.trackId === trackId) {
            if(next.started) {
                next.source.stop();
                next.source.disconnect();
            }
            next.source = this.ctx.createBufferSource();
            next.source.buffer = next.buffer;
            next.source.connect(this.outputNodes[this.next()]);
            next.startTime = this.ctx.currentTime;
            next.source.start(next.startTime);
            this.switchTrack((trackId + 1) % this.playList.length);
            return;
        }

        this.setSource(trackId, this.next(), src => {
            if(switchAfterLoad) {
                src.started = true;
                src.startTime = this.ctx.currentTime;
                src.source.start(this.ctx.currentTime);
                this.switchTrack((trackId + 1) % this.playList.length);
            } else {
                const curr = this.currSource();

                if(curr && this.isPlaying()) {
                    src.startTime = curr.startTime + curr.buffer.duration;
                    src.started = true;
                    src.source.start(src.startTime - .1);
                    const timeout = 1000 * (curr.buffer.duration - (this.ctx.currentTime - curr.startTime));

                    this.syncTimeout = setTimeout(() => {
                        this.switchTrack((trackId + 1) % this.playList.length);
                    }, timeout);
                }
            }
        });
    }

    // This method advances the current track to the next track (the track loaded into the other source/output)
    private switchTrack(nextTrack: number): void {
        const curr = this.currSource();
        if(curr) {
            if(curr.started) {
                curr.source.stop();
                curr.source.disconnect();
            }

            this.sourceCache[this.curr()] = null;
        }

        this.swapSource();
        this.queueTrack(nextTrack);
    }

    public enqueue(arr: (File | string)[]): void {
        const preload = this.playList.length === 0;

        this.playList = [
            ...this.playList,
            ...arr,
        ];

        if(preload && this.playList.length > 0) {
            if(this.isStopped()) {
                this.queueTrack(0);
            }
        }
    }

    public clearPlaylist(): void {
        if(this.isPlaying() || this.isPaused()) {
            // Shutdown currently playing source, flush queue
            this.stop();
        }

        this.playList = new Array<File | string>();
    }

    public playURL(url: string): void {
        loadURLAudioBuffer(this.ctx, this.fileReader, url, buf => {
            if(this.isStopped() || this.isPlaying()) { // We ain't got nothing going on...
                const curr = makeCacheObject(
                    0,
                    buf,
                    this.ctx.createBufferSource(),
                );
                curr.source.buffer = buf;
                curr.startTime = this.ctx.currentTime;
                curr.source.start();
                curr.started = true;
                curr.source.connect(this.outputNodes[this.curr()]);
                this.sourceCache[this.curr()] = curr;
                this.state = PlayerState.PLAYING;
                return true;
            }

            return false;
        });
    }

    public pause(): void {

    }

    public stop(): void {
        this.clearTimeout();
        const next = this.nextSource();
        if(next && next.started) {
            next.source.stop();
            next.source.disconnect();
            this.sourceCache[this.next()] = null;
        }
        const curr = this.currSource();
        if(curr && curr.started) {
            curr.source.stop();
            curr.source.disconnect();
            this.sourceCache[this.curr()] = null;
        }
        this.state = PlayerState.STOPPED;
        // Queue the first track
        this.queueTrack(0);
    }

    public play(): void {
        if(this.isStopped()) {
            const curr = this.currSource();
            if(curr) {
                curr.startTime = this.ctx.currentTime;
                curr.source.start();
                curr.started = true;
            } else {
                const next = this.nextSource();
                if(next) {
                    this.state = PlayerState.PLAYING;
                    next.startTime = this.ctx.currentTime;
                    next.source.start();
                    next.started = true;
                    this.swapSource();
                    this.queueTrack((next.trackId + 1) % this.playList.length);
                }
            }
        } else if(this.isPaused()) {
            // Start the existing tracks again.
        }
    }

    public currTrack(): number {
        const curr = this.currSource();
        return curr ? curr.trackId : 0;
    }

    public prevTrack(): void {
        const curr = this.currTrack();
        this.queueTrack(curr === 0 ? this.playList.length - 1 : curr - 1, true);
    }

    public nextTrack(): void {
        this.queueTrack((this.currTrack() + 1) % this.playList.length, true);
    }
}