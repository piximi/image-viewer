import { SelectionOperator } from "./SelectionOperator";
import * as ImageJS from "image-js";
import * as _ from "lodash";
import { connectPoints } from "../imageHelper";
import { encode } from "../rle";
import { isoLines } from "marchingsquares";

export class PenSelectionOperator extends SelectionOperator {
  brushSize: number = 8;
  circles: Uint8ClampedArray | Uint8Array | undefined = undefined;
  buffer: Array<number> = [];
  outline: Array<number> = [];
  points: Array<number> = [];

  get boundingBox(): [number, number, number, number] | undefined {
    if (!this.outline) return undefined;

    const pairs = _.chunk(this.outline, 2);

    return [
      Math.round(_.min(_.map(pairs, _.first))!),
      Math.round(_.min(_.map(pairs, _.last))!),
      Math.round(_.max(_.map(pairs, _.first))!),
      Math.round(_.max(_.map(pairs, _.last))!),
    ];
  }

  computeCircleData(): Uint8Array | Uint8ClampedArray | undefined {
    const canvas = document.createElement("canvas");
    canvas.width = this.image.width;
    canvas.height = this.image.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return undefined;

    const connected = connectPoints(
      _.chunk(this.points, 2),
      new ImageJS.Image(this.image.width, this.image.height)
    );
    connected.forEach((position) => {
      ctx.beginPath();
      ctx.arc(
        Math.floor(position[0]),
        Math.floor(position[1]),
        5,
        0,
        Math.PI * 2,
        true
      ); //FIXME radius should determined by the tool
      ctx.fill();
    });

    const rgbMask = ImageJS.Image.fromCanvas(canvas);
    // @ts-ignore
    this.circles = rgbMask.getChannel(3).data;
  }

  get contour(): Array<number> | undefined {
    if (!this.outline) return [];

    return this.outline;
  }

  get mask(): Array<number> | undefined {
    if (!this.circles) return;

    return encode(this.circles);
  }

  deselect() {
    this.selected = false;
    this.selecting = false;

    this.circles = undefined;
    this.buffer = [];
    this.outline = [];
    this.points = [];
  }

  onMouseDown(position: { x: number; y: number }) {
    if (this.selected) return;

    this.selecting = true;

    this.buffer = [...this.buffer, position.x, position.y];
  }

  onMouseMove(position: { x: number; y: number }) {
    if (this.selected || !this.selecting) return;

    this.buffer = [...this.buffer, position.x, position.y];
  }

  onMouseUp(position: { x: number; y: number }) {
    if (this.selected || !this.selecting) return;

    this.selected = true;

    this.selecting = false;

    this.points = this.buffer;

    this.computeCircleData();

    if (!this.circles) return;

    const bar = _.map(
      _.chunk(this.circles, this.image.width),
      (el: Array<number>) => {
        return Array.from(el);
      }
    );
    const polygons = isoLines(bar, 1);
    polygons.sort((a: Array<number>, b: Array<number>) => {
      return b.length - a.length;
    });
    this.outline = _.flatten(polygons[0]);
  }
}
