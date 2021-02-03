import { ObjectSelectionOperator } from "../../image/selection";
import * as ReactKonva from "react-konva";
import React, { useEffect, useState } from "react";
import { useMarchingAnts } from "../../hooks";
import useImage from "use-image";

type ObjectSelectionProps = {
  operator: ObjectSelectionOperator;
};

export const ObjectSelection = ({ operator }: ObjectSelectionProps) => {
  const [image, setImage] = useState<HTMLImageElement>();

  useEffect(() => {
    if (operator.prediction) {
      const img = new Image();

      img.onload = () => {};

      img.src = operator.prediction.toDataURL();
      setImage(img);
    }
  });

  const dashOffset = useMarchingAnts();

  if (!operator.origin || !operator.width || !operator.height) return null;

  return (
    <ReactKonva.Group>
      <ReactKonva.Rect
        dash={[4, 2]}
        dashOffset={-dashOffset}
        height={operator.height}
        stroke="black"
        strokeWidth={1}
        width={operator.width}
        x={operator.origin.x}
        y={operator.origin.y}
      />

      <ReactKonva.Rect
        dash={[4, 2]}
        dashOffset={-dashOffset}
        height={operator.height}
        stroke="white"
        strokeWidth={1}
        width={operator.width}
        x={operator.origin.x}
        y={operator.origin.y}
      />

      <ReactKonva.Image
        image={image}
        x={operator.origin.x}
        y={operator.origin.y}
      />
    </ReactKonva.Group>
  );
};
