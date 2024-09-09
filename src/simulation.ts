import { vec3 } from "gl-matrix";

interface SimulationCell {
    state: number;
    neighbours: number;
}

interface SimulationData {
    size: number;
    world: SimulationCell[][][];
}

interface SimulationRule {
    survWith: Set<number>;
    bornWith: Set<number>;
    initialState: number;
}

export class Simulation {

    private size: number; // size x size x size
    private worldIndex: number;
    private worlds: SimulationCell[][][][];
    //
    private isplaying: boolean;
    private tickTotSec: number;
    private tickSpeedSec: number;
    //
    private seed: number;
    private rule: SimulationRule;

    constructor(size: number) {
        this.size = size;
        this.worldIndex = 0;
        this.worlds = new Array<Array<Array<Array<SimulationCell>>>>(2).fill(null).map(() =>
            new Array<Array<Array<number>>>(size + 2).fill(null).map((_, x) =>
                new Array<Array<number>>(size + 2).fill(null).map((_, y) =>
                    new Array<number>(size + 2).fill(null).map((_, z) => {
                        return {
                            pos: vec3.fromValues(x, y, z),
                            col: vec3.fromValues(0, 1, 0),
                            state: 0,
                            neighbours: 0,
                        }
                    })
                )
            )
        );
        this.isplaying = true;
        this.tickTotSec = 0;
        this.tickSpeedSec = 1 / 16;
        this.seed = Math.random();
        this.rule = {
            survWith: new Set([4]),
            bornWith: new Set([4]),
            initialState: 4,
        };
        this.restart();
    }

    setSeed(newSeed: number) {
        this.seed = newSeed;
        this.restart();
    }

    setRule(newRule: SimulationRule) {
        this.rule = newRule;
        this.restart();
    }

    setSpeed(tickPerSec: number) {
        this.tickSpeedSec = 1 / tickPerSec;
    }

    play() {
        this.isplaying = true;
    }

    pause() {
        this.isplaying = false;
    }

    restart() {
        this.worldIndex = 0;
        const center = Math.floor(this.size / 2);
        const rad = 3;
        for (let x = 0; x < this.size; ++x)
            for (let y = 0; y < this.size; ++y)
                for (let z = 0; z < this.size; ++z) {
                    const dx = Math.abs(x - center);
                    const dy = Math.abs(y - center);
                    const dz = Math.abs(z - center);
                    this.worlds[0][x + 1][y + 1][z + 1].state = 0;
                    if (rad * rad > dx * dx + dy * dy + dz * dz) {
                        if (Math.random() < 0.5) {
                            this.worlds[0][x+1][y+1][z+1].state = this.rule.initialState;
                        }
                    }
                }
        this.tick();
    }

    update(dtSec: number) {
        this.tickTotSec += Math.min(dtSec, 1.0);
        while (this.tickTotSec >= this.tickSpeedSec) {
            this.tickTotSec -= this.tickSpeedSec;
            if (!this.isplaying) continue;
            this.tick();
        }
    }

    tick() {
        const lastWorld = this.worlds[this.worldIndex];
        const world = this.worlds[(this.worldIndex + 1) % 2];
        for (let x = 0; x < this.size; ++x)
            for (let y = 0; y < this.size; ++y)
                for (let z = 0; z < this.size; ++z) {
                    // Get last state
                    const lastState = lastWorld[x + 1][y + 1][z + 1].state;

                    // Count neighbours
                    let neighbours = 0;
                    for (let dx = -1; dx <= 1; ++dx)
                        for (let dy = -1; dy <= 1; ++dy)
                            for (let dz = -1; dz <= 1; ++dz) {
                                if (lastWorld[x + dx + 1][y + dy + 1][z + dz + 1].state == this.rule.initialState)
                                    neighbours++;
                            }
                    if (lastState == this.rule.initialState)
                        neighbours--;
                    world[x + 1][y + 1][z + 1].neighbours = neighbours;

                    // Was alive
                    if (lastState == this.rule.initialState) {
                        // Can survive
                        if (this.rule.survWith.has(neighbours)) {
                            // Keep alive
                            world[x + 1][y + 1][z + 1].state = this.rule.initialState;
                        } else {
                            // Start dying
                            world[x + 1][y + 1][z + 1].state = lastState - 1;
                        }
                    }
                    // Was dead
                    else if (lastState == 0) {
                        // Can be born
                        if (this.rule.bornWith.has(neighbours)) {
                            // Born
                            world[x + 1][y + 1][z + 1].state = this.rule.initialState;
                        } else {
                            // Keep dead
                            world[x + 1][y + 1][z + 1].state = 0;
                        }
                    }
                    // Was dying
                    else {
                        // Keep dying
                        world[x + 1][y + 1][z + 1].state = lastState - 1;
                    }
                }
        //
        this.worldIndex = (this.worldIndex + 1) % 2;
    }

    data(): SimulationData {
        return {
            size: this.size,
            world: this.worlds[this.worldIndex],
        };
    }

    colorRule(cell: SimulationCell, col: vec3) {
        vec3.set(col, 1, 0, 0);
        vec3.scale(col, col, (cell.state) / (this.rule.initialState));
        // vec3.scale(col, col, cell.neighbours / 26.0);
        return col;
    }

}
