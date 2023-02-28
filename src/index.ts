import { App } from "./main";
import { resizeCanvasToDisplaySize } from "./webgl/utils";

window.onload = function () {
    const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("webgl2", {alpha: false});
    const app = new App(ctx);
    //
    var lastTsMs = performance.now();
    function frame(tsMs: number) {
        const needResize = resizeCanvasToDisplaySize(canvas);
        if (needResize) {
            app.updateViewport(canvas.clientWidth, canvas.clientHeight);
        }
        const dtMs = (tsMs - lastTsMs) / 1000;
        lastTsMs = tsMs;
        app.render(dtMs);
        //
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}