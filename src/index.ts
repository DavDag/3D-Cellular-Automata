import GLBench from 'gl-bench/dist/gl-bench.module';
import {App} from "./main";
import {resizeCanvasToDisplaySize} from "./webgl/utils";

window.onload = function () {
    const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    //const ctx = canvas.getContext("webgl2", {alpha: false, premultipliedAlpha: true, powerPreference: "high-performance", antialias: false, desynchronized: true});
    const ctx = canvas.getContext("webgl2");
    const bench = new GLBench(ctx, {trackGPU: true});
    const app = new App(ctx);
    //
    canvas.addEventListener("wheel", (event: WheelEvent) => {
        const delta = (event.deltaY > 0) ? 1 : -1;
        app.zoom(delta * 0.1);
    });
    //
    const menuDiv: HTMLDivElement = document.getElementById("menu") as HTMLDivElement;
    document.getElementById("play").onclick = () => app.play();
    document.getElementById("pause").onclick = () => app.pause();
    document.getElementById("restart").onclick = () => app.restart();
    document.getElementById("speed").onchange = (e) => app.speed((e.target as any).value);
    document.getElementById("rule").onchange = (e) => app.rule((e.target as any).value);
    document.getElementById("manual-rule").onchange = (e) => app.rule((e.target as any).value);
    window.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key == "Tab") {
            menuDiv.style.opacity = (menuDiv.style.opacity == "0") ? "1" : "0";
            event.preventDefault();
        }
    });
    //
    let lastTsMs = performance.now();

    function frame(tsMs: number) {
        bench.begin();
        const needResize = resizeCanvasToDisplaySize(canvas);
        if (needResize) {
            app.updateViewport(canvas.clientWidth, canvas.clientHeight);
        }
        const dtMs = (tsMs - lastTsMs);
        lastTsMs = tsMs;
        app.render(dtMs / 1000, bench);
        //
        bench.end();
        bench.nextFrame(tsMs);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}
