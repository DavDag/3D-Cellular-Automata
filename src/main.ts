import { Renderer } from "./renderer";
import { Simulation } from "./simulation";
import { FpsCounter } from "./webgl/fps";

export class App {

    private ctx: WebGL2RenderingContext;
    private fpsCounter: FpsCounter;
    private simulation: Simulation;
    private renderer: Renderer;

    constructor(ctx: WebGL2RenderingContext) {
        this.ctx = ctx;
        this.fpsCounter = new FpsCounter();
        this.simulation = new Simulation(25);
        this.renderer = new Renderer(ctx);
    }

    updateViewport(w: number, h: number) {
        this.renderer.updateViewport(w, h);
    }

    render(dtMs: number) {
        const ctx = this.ctx;
        this.fpsCounter.tick(dtMs);
        this.simulation.tick();
        this.renderer.render(dtMs, this.simulation);
    }

}
