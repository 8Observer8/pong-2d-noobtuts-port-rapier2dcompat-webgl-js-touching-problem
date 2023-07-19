import RAPIER from "rapier2d-compat";

export default function initRapier2D() {
    return new Promise(resolve => {
        RAPIER.init().then(() => {
            resolve();
        });
    });
}
