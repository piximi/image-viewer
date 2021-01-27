import { RectangularSelectionOperator } from "./RectangularSelectionOperator";
import { test } from "@jest/globals";
import {ObjectSelectionOperator} from "./ObjectSelectionOperator";
import dog from "./dog.jpg";

const { Image } = require("image-js");

test("deselect", () => {
  const selectionOperator = new RectangularSelectionOperator();

  selectionOperator.selected = true;

  selectionOperator.origin = { x: 0, y: 0 };

  selectionOperator.width = 100;
  selectionOperator.height = 100;

  selectionOperator.deselect();

  expect(selectionOperator.selected).toBe(false);
  expect(selectionOperator.selecting).toBe(false);

  expect(selectionOperator.selection).toBe(undefined);

  expect(selectionOperator.origin).toStrictEqual(undefined);

  expect(selectionOperator.width).toBe(undefined);
  expect(selectionOperator.height).toBe(undefined);
});

test("onMouseDown", async () => {
  const img = new HTMLImageElement();

  img.src = "https://picsum.photos/256/256";

  const image = await Image.load(img);

  expect(false).toBe(true);

  // const selectionOperator = new ObjectSelectionOperator(image);
  //
  // selectionOperator.onMouseDown({ x: 0, y: 0 });
  //
  // expect(selectionOperator.selected).toBe(false);
  // expect(selectionOperator.selecting).toBe(true);
  //
  // expect(selectionOperator.selection).toBe(undefined);
  //
  // expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });
  //
  // expect(selectionOperator.width).toBe(undefined);
  // expect(selectionOperator.height).toBe(undefined);
});

test("onMouseMove", () => {
  const selectionOperator = new RectangularSelectionOperator();

  selectionOperator.selecting = true;

  selectionOperator.origin = { x: 0, y: 0 };

  selectionOperator.onMouseMove({ x: 100, y: 100 });

  expect(selectionOperator.selected).toBe(false);
  expect(selectionOperator.selecting).toBe(true);

  expect(selectionOperator.selection).toBe(undefined);

  expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(selectionOperator.width).toBe(100);
  expect(selectionOperator.height).toBe(100);
});

test("onMouseUp", () => {
  const selectionOperator = new RectangularSelectionOperator();

  selectionOperator.selecting = true;

  selectionOperator.origin = { x: 0, y: 0 };

  selectionOperator.onMouseUp({ x: 100, y: 100 });

  expect(selectionOperator.selected).toBe(true);
  expect(selectionOperator.selecting).toBe(false);

  expect(selectionOperator.selection).toBe(undefined);

  expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(selectionOperator.width).toBe(100);
  expect(selectionOperator.height).toBe(100);
});

test("select", () => {
  const selectionOperator = new RectangularSelectionOperator();

  selectionOperator.selected = true;

  selectionOperator.origin = { x: 0, y: 0 };

  selectionOperator.width = 100;
  selectionOperator.height = 100;

  selectionOperator.select(0);

  expect(selectionOperator.selected).toBe(true);
  expect(selectionOperator.selecting).toBe(false);

  expect(selectionOperator.selection).toStrictEqual({
    box: [0, 0, 100, 100],
    category: 0,
    mask: "mask",
  });

  expect(selectionOperator.boundingBox).toStrictEqual([0, 0, 100, 100]);
  expect(selectionOperator.mask).toBe("mask");

  expect(selectionOperator.origin).toStrictEqual({ x: 0, y: 0 });

  expect(selectionOperator.width).toBe(100);
  expect(selectionOperator.height).toBe(100);
});
