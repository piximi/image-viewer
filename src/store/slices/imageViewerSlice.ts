import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImageViewerState } from "../../types/ImageViewerState";
import { Image } from "../../types/Image";
import { ImageViewerSelectionMode } from "../../types/ImageViewerSelectionMode";
import { ImageViewerOperation } from "../../types/ImageViewerOperation";
import { ImageViewerZoomMode } from "../../types/ImageViewerZoomMode";

const initialState: ImageViewerState = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  hue: 0,
  operation: ImageViewerOperation.RectangularSelection,
  saturation: 0,
  selectionMode: ImageViewerSelectionMode.New,
  vibrance: 0,
  zoomMode: ImageViewerZoomMode.In,
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    setImageViewerBrightness(
      state: ImageViewerState,
      action: PayloadAction<{ brightness: number }>
    ) {
      state.brightness = action.payload.brightness;
    },
    setImageViewerContrast(
      state: ImageViewerState,
      action: PayloadAction<{ contrast: number }>
    ) {
      state.contrast = action.payload.contrast;
    },
    setImageViewerExposure(
      state: ImageViewerState,
      action: PayloadAction<{ exposure: number }>
    ) {
      state.exposure = action.payload.exposure;
    },
    setImageViewerHue(
      state: ImageViewerState,
      action: PayloadAction<{ hue: number }>
    ) {
      state.hue = action.payload.hue;
    },
    setImageViewerImage(
      state: ImageViewerState,
      action: PayloadAction<{ image: Image }>
    ) {
      state.image = action.payload.image;
    },
    setImageViewerOperation(
      state: ImageViewerState,
      action: PayloadAction<{ operation: ImageViewerOperation }>
    ) {
      state.operation = action.payload.operation;
    },
    setImageViewerSaturation(
      state: ImageViewerState,
      action: PayloadAction<{ saturation: number }>
    ) {
      state.saturation = action.payload.saturation;
    },
    setImageViewerSelectionMode(
      state: ImageViewerState,
      action: PayloadAction<{ selectionMode: ImageViewerSelectionMode }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },
    setImageViewerVibrance(
      state: ImageViewerState,
      action: PayloadAction<{ vibrance: number }>
    ) {
      state.vibrance = action.payload.vibrance;
    },
    setImageViewerZoomMode(
      state: ImageViewerState,
      action: PayloadAction<{ zoomMode: ImageViewerZoomMode }>
    ) {
      state.zoomMode = action.payload.zoomMode;
    },
  },
});

export const {
  setImageViewerBrightness,
  setImageViewerContrast,
  setImageViewerExposure,
  setImageViewerHue,
  setImageViewerImage,
  setImageViewerOperation,
  setImageViewerSaturation,
  setImageViewerSelectionMode,
  setImageViewerVibrance,
  setImageViewerZoomMode,
} = imageViewerSlice.actions;
