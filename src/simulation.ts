import { Vector3 } from "@math.gl/core";

interface SimulationCell {
    pos: Vector3;
    col: Vector3;
}

interface SimulationData {
    size: number;
    world: Array<SimulationCell>;
}

export class Simulation {

    private size: number; // size x size x size

    constructor(size: number) {
        this.size = size;
    }

    tick() {
        
    }

    data(): SimulationData {
        return {
            size: this.size,
            world: [
                {pos: new Vector3(0, 0, 0), col: new Vector3(1, 0, 0)},
                {pos: new Vector3(1, 1, 1), col: new Vector3(0, 1, 0)},
                {pos: new Vector3(0, 3, 0), col: new Vector3(0, 0, 1)},
            ]
        }
    }

}
