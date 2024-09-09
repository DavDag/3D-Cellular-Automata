
export class FpsCounter {
    
    public fps: number;
    private frameCount: number;
    private frameCountTimeSec: number;

    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.frameCountTimeSec = 0;
    }

    tick(dtSec: number) {
        this.frameCount++;
        this.frameCountTimeSec += dtSec;
        if (this.frameCountTimeSec > 1) {
            this.fps = this.frameCount / this.frameCountTimeSec;
            this.frameCount = 0;
            this.frameCountTimeSec = 0;
            //console.log(this.fps);
        }
    }

}
