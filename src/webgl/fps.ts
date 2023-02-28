
export class FpsCounter {
    
    private fps: number;
    private frameCount: number;
    private frameCountTimeMs: number;

    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.frameCountTimeMs = 0;
    }

    tick(dtMs: number) {
        this.frameCount++;
        this.frameCountTimeMs += dtMs;
        if (this.frameCountTimeMs > 1) {
            this.fps = this.frameCount / this.frameCountTimeMs;
            this.frameCount = 0;
            this.frameCountTimeMs = 0;
            console.log(this.fps);
        }
    }

}
