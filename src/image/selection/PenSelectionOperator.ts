import { SelectionOperator } from "./SelectionOperator";
import * as ImageJS from "image-js";
import * as _ from "lodash";
import { connectPoints } from "../imageHelper";
import { encode } from "../rle";
import { isoLines } from "marchingsquares";

export class PenSelectionOperator extends SelectionOperator {
  brushSize: number = 8;
  circlesData: Uint8ClampedArray | Uint8Array | undefined = undefined;
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
        this.brushSize / 2,
        0,
        Math.PI * 2,
        true
      );
      ctx.fill();
    });

    const rgbMask = ImageJS.Image.fromCanvas(canvas);
    // @ts-ignore
    this.circlesData = this.thresholdMask(rgbMask.getChannel(3)).data;
  }

  get contour(): Array<number> | undefined {
    if (!this.outline) return [];

    return this.outline;
  }

  get mask(): Array<number> | undefined {
    if (!this.circlesData) return [];

    return encode(this.circlesData);
  }

  deselect() {
    this.selected = false;
    this.selecting = false;

    this.circlesData = undefined;
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

    const baz = this.mask;

    if (!this.circlesData) return;

    const bar = _.map(
      _.chunk(this.circlesData, this.image.width),
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

  static async setup(image: ImageJS.Image, brushSize: number) {
    const operator = new PenSelectionOperator(image);

    operator.brushSize = brushSize;

    return operator;
  }

  private thresholdMask = (mask: ImageJS.Image) => {
    for (let x = 0; x < mask.width; x++) {
      for (let y = 0; y < mask.height; y++) {
        if (mask.getPixelXY(x, y)[0] > 1) {
          mask.setPixelXY(x, y, [255]);
        }
      }
    }
    return mask;
  };
}
