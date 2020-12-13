import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStyles } from "./PenCanvas.css";
import { Pen } from "../../image/Pen/Pen";
import { midpoint, Point } from "../../image/Pen/Point";
import { CatenaryCurve } from "../../image/Pen/CatenaryCurve";

type Stroke = {
  color: string;
  radius: number;
  points: Array<{ x: number; y: number }>;
};

type PenProps = {
  src: string;
};

const drawCatenaryCurve = (
  context: CanvasRenderingContext2D,
  curve: CatenaryCurve,
  a: Point,
  b: Point,
  chainLength: number
) => {
  context.beginPath();
  context.lineWidth = 2;
  context.lineCap = "round";
  context.setLineDash([2, 4]);
  context.strokeStyle = "#0a0302";
  curve.drawToCanvas(context, a, b, chainLength);
  context.stroke();
};

const drawCursor = (context: CanvasRenderingContext2D, point: Point) => {
  context.beginPath();
  context.fillStyle = "#0a0302";
  context.arc(point.x, point.y, 4, 0, Math.PI * 2, true);
  context.fill();
};

const drawPreview = (context: CanvasRenderingContext2D, point: Point) => {
  context.beginPath();
  context.fillStyle = "#444";
  context.arc(point.x, point.y, 10, 0, Math.PI * 2, true);
  context.fill();
};

const drawTip = (context: CanvasRenderingContext2D, point: Point) => {
  context.beginPath();
  context.fillStyle = "#0a0302";
  context.arc(point.x, point.y, 2, 0, Math.PI * 2, true);
  context.fill();
};

export const PenCanvas = ({ src }: PenProps) => {
  const interfaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const temporaryCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [
    interfaceCanvasContext,
    setInterfaceCanvasContext,
  ] = useState<CanvasRenderingContext2D | null>(null);
  const [
    selectionCanvasContext,
    setSelectionCanvasContext,
  ] = useState<CanvasRenderingContext2D | null>(null);
  const [
    temporaryCanvasContext,
    setTemporaryCanvasContext,
  ] = useState<CanvasRenderingContext2D | null>(null);

  const [catenaryCurve, setCatenaryCurve] = useState<CatenaryCurve>(
    new CatenaryCurve()
  );

  const chainLength = 12 * window.devicePixelRatio;

  const [pen, setPen] = useState<Pen>(
    new Pen(
      true,
      new Point({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }),
      12 * window.devicePixelRatio
    )
  );

  const [strokes, setStrokes] = useState<Array<Stroke>>([]);
  const [moved, setMoved] = useState<boolean>(false);
  const [pressed, setPressed] = useState<boolean>(false);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [updated, setUpdated] = useState<boolean>(false);

  const classes = useStyles();

  const drawPoints = (color: string, radius: number) => {
    if (points.length < 2) return;

    if (temporaryCanvasContext) {
      temporaryCanvasContext.lineJoin = "round";
      temporaryCanvasContext.lineCap = "round";
      temporaryCanvasContext.strokeStyle = color;

      temporaryCanvasContext.clearRect(
        0,
        0,
        temporaryCanvasContext.canvas.width,
        temporaryCanvasContext.canvas.height
      );
      temporaryCanvasContext.lineWidth = radius * 2;

      let p1 = points[0];
      let p2 = points[1];

      temporaryCanvasContext.moveTo(p2.x, p2.y);
      temporaryCanvasContext.beginPath();

      for (let i = 1, len = points.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        const m = midpoint(new Point(p1), new Point(p2));

        temporaryCanvasContext.quadraticCurveTo(p1.x, p1.y, m.x, m.y);
        p1 = points[i];
        p2 = points[i + 1];
      }

      // Draw last line as a straight line while
      // we wait for the next point to be able to calculate
      // the bezier control point
      temporaryCanvasContext.lineTo(p1.x, p1.y);
      temporaryCanvasContext.stroke();
    }
  };

  const getPosition = (
    event: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } => {
    const boundingClientRect = interfaceCanvasRef.current?.getBoundingClientRect();

    let x: number;
    let y: number;

    if (event instanceof TouchEvent) {
      x = event.changedTouches[0].clientX;
      y = event.changedTouches[0].clientY;
    } else {
      x = (event as React.MouseEvent).clientX;
      y = (event as React.MouseEvent).clientY;
    }

    return {
      x: x - boundingClientRect!.left,
      y: y - boundingClientRect!.top,
    };
  };

  const move = (x: number, y: number) => {
    pen.update(new Point({ x: x, y: y }));

    if ((pressed && !selecting) || (!pen.enabled && pressed)) {
      setSelecting(true);

      setPoints([...points, { x: pen.tip.x, y: pen.tip.y }]);
    }

    if (selecting) {
      setPoints([...points, { x: pen.tip.x, y: pen.tip.y }]);

      drawPoints("#444", 10);
    }

    setMoved(true);
  };

  const onEnd = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();

    onMove(event);

    setSelecting(false);

    setPressed(false);

    save("#444", 10);
  };

  const onMove = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();

    const { x, y } = getPosition(event);

    move(x, y);
  };

  const onStart = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();

    setPressed(true);

    const { x, y } = getPosition(event);

    if (event instanceof TouchEvent) {
      pen.update(new Point({ x: x, y: y }), true);
    }

    move(x, y);
  };

  const render = useCallback(
    ({ once = false } = {}) => {
      const draw = (context: CanvasRenderingContext2D, a: Point, b: Point) => {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        drawPreview(context, b);

        drawCursor(context, a);

        if (pen.enabled) {
          drawCatenaryCurve(context, catenaryCurve, a, b, chainLength);
        }

        drawTip(context, b);
      };

      if (moved || updated) {
        const pointer = pen.getPointerCoordinates();
        const tip = pen.getTipCoordinates();

        draw(interfaceCanvasContext!, new Point(pointer), new Point(tip));

        setMoved(false);
        setUpdated(false);
      }

      if (!once) {
        window.requestAnimationFrame(() => {
          render();
        });
      }
    },
    [catenaryCurve, chainLength, interfaceCanvasContext, moved, pen, updated]
  );

  const save = (color: string, radius: number) => {
    if (points.length < 2) return;

    setStrokes([
      ...strokes,
      { color: color, points: [...points], radius: radius },
    ]);

    setPoints([]);

    if (temporaryCanvasRef && temporaryCanvasRef.current) {
      const width = temporaryCanvasRef.current.width;
      const height = temporaryCanvasRef.current.height;

      selectionCanvasContext?.drawImage(
        temporaryCanvasRef.current,
        0,
        0,
        width!,
        height!
      );

      temporaryCanvasContext?.clearRect(0, 0, width!, height!);
    }
  };

  useEffect(() => {
    if (interfaceCanvasRef && interfaceCanvasRef.current) {
      setInterfaceCanvasContext(interfaceCanvasRef.current?.getContext("2d"));
    }

    if (selectionCanvasRef && selectionCanvasRef.current) {
      setSelectionCanvasContext(selectionCanvasRef.current?.getContext("2d"));
    }

    if (temporaryCanvasRef && temporaryCanvasRef.current) {
      setTemporaryCanvasContext(temporaryCanvasRef.current?.getContext("2d"));
    }

    render();
  }, [render]);

  return (
    <div className={classes.canvasContainer}>
      <canvas
        className={classes.canvasInterface}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onTouchCancel={onEnd}
        onTouchEnd={onEnd}
        onTouchMove={onMove}
        onTouchStart={onStart}
        ref={interfaceCanvasRef}
      />
      <canvas className={classes.canvasDrawing} ref={selectionCanvasRef} />
      <canvas className={classes.canvasTmp} ref={temporaryCanvasRef} />
    </div>
  );
};
