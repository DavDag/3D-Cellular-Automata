import GLBench from "gl-bench";
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
        this.simulation = new Simulation(64);
        this.renderer = new Renderer(ctx, 64);

        this.rule("9-26/5-7,12-13,15/5");
    }

    updateViewport(w: number, h: number) {
        this.renderer.updateViewport(w, h);
    }

    zoom(delta: number) {
        this.renderer.zoom(delta);
    }

    play() {
        this.simulation.play();
    }

    pause() {
        this.simulation.pause();
    }

    restart() {
        this.simulation.restart();
    }

    speed(value: string) {
        const tickPerSec = Number.parseInt(value);
        this.simulation.setSpeed(tickPerSec);
    }

    rule(value: string) {
        const pieces = value.split("/");
        const survWith = pieces[0].split(",")
            .flatMap((p: string) => {
                if (p.includes("-")) {
                    const limits = p.split("-");
                    const beg = Number.parseInt(limits[0]);
                    const end = Number.parseInt(limits[1]);
                    return new Array(end - beg + 1).fill(0).map((_, i) => beg + i);
                }
                return [Number.parseInt(p)];
            });
        const bornWith = pieces[1].split(",")
            .flatMap((p: string) => {
                if (p.includes("-")) {
                    const limits = p.split("-");
                    const beg = Number.parseInt(limits[0]);
                    const end = Number.parseInt(limits[1]);
                    return new Array(end - beg + 1).fill(0).map((_, i) => beg + i);
                }
                return [Number.parseInt(p)];
            });
        const initialState = Number.parseInt(pieces[2])-1;
        console.log(survWith, bornWith, initialState);
        this.simulation.setRule({
            survWith: new Set(survWith),
            bornWith: new Set(bornWith),
            initialState: initialState,
        });
    }

    render(dtSec: number, bench: GLBench) {
        const ctx = this.ctx;
        this.fpsCounter.tick(dtSec);
        bench.begin("Simulation");
        this.simulation.update(dtSec);
        bench.end("Simulation");
        bench.begin("Rendering");
        this.renderer.render(dtSec, this.simulation, bench);
        bench.begin("Rendering");
    }

}
