import type { ClipProblem } from "./validate-clip";

export class ClipError extends Error {
  constructor(readonly problem: ClipProblem) {
    super(`Clip refusé : ${problem}`);
    this.name = "ClipError";
  }
}
