import * as tensorflow from "@tensorflow/tfjs";
import {
  Category,
  Image,
  LossFunction,
  OptimizationAlgorithm,
  Project,
} from "./store";
import { History, LayersModel, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { Scalar } from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { createAction } from "@reduxjs/toolkit";
import { put, select, takeEvery } from "redux-saga/effects";

export type ClassifierState = {
  compiled?: LayersModel;
  compiling: boolean;
  data?: Dataset<{ xs: Tensor; ys: Tensor }>;
  evaluating: boolean;
  evaluations?: Scalar | Array<Scalar>;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  generating: boolean;
  history?: History;
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  lossHistory?: Array<{ x: number; y: number }>;
  metrics: Array<Metric>;
  model?: LayersModel;
  opened?: LayersModel;
  opening: boolean;
  optimizationAlgorithm: OptimizationAlgorithm;
  predicting: boolean;
  predictions?: Tensor;
  saving: boolean;
  trainingPercentage: number;
  validationData?: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationLossHistory?: Array<{ x: number; y: number }>;
  validationPercentage: number;
};

export enum Metric {
  BinaryAccuracy = "Binary accuracy",
  BinaryCrossEntropy = "Binary cros-sentropy",
  CategoricalAccuracy = "Categorical accuracy",
  CategoricalCrossentropy = "Categorical cross-entropy",
  CosineProximity = "Cosine proximity",
  MeanAbsoluteError = "Mean absolute error (MAE)",
  MeanAbsolutePercentageError = "Mean absolute percentage error",
  MeanSquaredError = "Mean squared error",
  Precision = "Precision",
  Recall = "Recall",
  SparseCategoricalAccuracy = "Sparse categorical accuracy",
}

export type CompileOptions = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
};

export type FitOptions = {
  epochs: number;
  batchSize: number;
  initialEpoch: number;
};

export const compile = (
  opened: tensorflow.LayersModel,
  options: CompileOptions
) => {
  const compiled = opened;

  const loss = () => {
    switch (options.lossFunction) {
      case LossFunction.AbsoluteDifference: {
        return "absoluteDifference";
      }
      case LossFunction.CosineDistance: {
        return "cosineDistance";
      }
      case LossFunction.Hinge: {
        return "hingeLoss";
      }
      case LossFunction.Huber: {
        return "huberLoss";
      }
      case LossFunction.Log: {
        return "logLoss";
      }
      case LossFunction.MeanSquaredError: {
        return "meanSquaredError";
      }
      case LossFunction.SigmoidCrossEntropy: {
        return "sigmoidCrossEntropy";
      }
      case LossFunction.SoftmaxCrossEntropy: {
        return "softmaxCrossEntropy";
      }
      default: {
        return "softmaxCrossEntropy";
      }
    }
  };

  const optimizer = (): tensorflow.Optimizer => {
    switch (options.optimizationAlgorithm) {
      case OptimizationAlgorithm.Adadelta: {
        return tensorflow.train.adadelta(options.learningRate);
      }
      case OptimizationAlgorithm.Adagrad: {
        return tensorflow.train.adagrad(options.learningRate);
      }
      case OptimizationAlgorithm.Adam: {
        return tensorflow.train.adam(options.learningRate);
      }
      case OptimizationAlgorithm.Adamax: {
        return tensorflow.train.adamax(options.learningRate);
      }
      case OptimizationAlgorithm.RMSProp: {
        return tensorflow.train.rmsprop(options.learningRate);
      }
      case OptimizationAlgorithm.StochasticGradientDescent: {
        return tensorflow.train.sgd(options.learningRate);
      }
      default: {
        return tensorflow.train.sgd(options.learningRate);
      }
    }
  };

  compiled.compile({
    optimizer: optimizer(),
    metrics: options.metrics,
    loss: loss(),
  });

  return compiled;
};

export const fit = async (
  compiled: LayersModel,
  data: Dataset<{ xs: Tensor; ys: Tensor }>,
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>,
  options: FitOptions,
  callback?: any
): Promise<{ fitted: LayersModel; status: History }> => {
  const args = {
    callbacks: {
      onBatchEnd: callback,
    },
    epochs: options.epochs,
    validationData: validationData.batch(options.batchSize),
  };

  const status = await compiled.fitDataset(data.batch(options.batchSize), args);

  return { fitted: compiled, status: status };
};

export const open = async (
  pathname: string,
  classes: number,
  units: number
): Promise<tensorflow.LayersModel> => {
  const backbone = await tensorflow.loadLayersModel(pathname);

  const truncated = tensorflow.model({
    inputs: backbone.inputs,
    outputs: backbone.getLayer("conv_pw_13_relu").output,
  });

  const a = tensorflow.layers.flatten({
    inputShape: truncated.outputs[0].shape.slice(1),
  });

  const b = tensorflow.layers.dense({
    units: units,
    activation: "relu",
    kernelInitializer: "varianceScaling",
    useBias: true,
  });

  const softmax = tensorflow.layers.dense({
    units: classes,
    kernelInitializer: "varianceScaling",
    useBias: false,
    activation: "softmax",
  });

  const config = {
    layers: [...truncated.layers, a, b, softmax],
  };

  return tensorflow.sequential(config);
};

export const encodeCategory = (categories: number) => {
  return (item: {
    xs: string;
    ys: number;
  }): { xs: string; ys: tensorflow.Tensor } => {
    return { ...item, ys: tensorflow.oneHot(item.ys, categories) };
  };
};

export const encodeImage = async (item: {
  xs: string;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const fetched = await tensorflow.util.fetch(item.xs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  const data: ImageJS.Image = await ImageJS.Image.load(buffer);

  const canvas: HTMLCanvasElement = data.getCanvas();

  const xs: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: xs });
  });
};

export const resize = async (item: {
  xs: tensorflow.Tensor3D;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const resized = tensorflow.image.resizeBilinear(item.xs, [224, 224]);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};

export const generator = (
  images: Array<Image>,
  categories: Array<Category>
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      const ys = categories.findIndex((category: Category) => {
        if (category.id !== "00000000-0000-0000-0000-00000000000") {
          return category.id === image.categoryId;
        }
      });

      yield {
        xs: image.src,
        ys: ys,
      };

      index++;
    }
  };
};

export const generate = async (
  images: Array<Image>,
  categories: Array<Category>,
  options?: { validationPercentage: number }
): Promise<{
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
}> => {
  const data = tensorflow.data
    .generator(generator(images, categories))
    .map(encodeCategory(categories.length - 1))
    .mapAsync(encodeImage);
  // .mapAsync(resize);

  const validationData = tensorflow.data
    .generator(generator(images, categories))
    .map(encodeCategory(categories.length - 1))
    .mapAsync(encodeImage);
  // .mapAsync(resize);

  return {
    data: data,
    validationData: validationData,
  };
};

/*
 * Actions
 */

export const compileAction = createAction<{
  opened: LayersModel;
  options: CompileOptions;
}>("CLASSIFIER_COMPILE");
export const compiledAction = createAction<{ compiled: LayersModel }>(
  "CLASSIFIER_COMPILED"
);
export const createCategoryAction = createAction<{ category: Category }>(
  "PROJECT_CREATE_CATEGORY"
);
export const createImageAction = createAction<{ image: Image }>(
  "PROJECT_CREATE_IMAGE"
);
export const createImagesAction = createAction<{ images: Array<Image> }>(
  "PROJECT_CREATE_IMAGES"
);
export const createProjectAction = createAction<{ project: Project }>(
  "PROJECT_CREATE_PROJECT"
);
export const deleteCategoryAction = createAction<{ category: Category }>(
  "PROJECT_DELETE_CATEGORY"
);
export const deleteImageAction = createAction<{ image: Image }>(
  "PROJECT_DELETE_IMAGE"
);
export const evaluateAction = createAction<{
  fitted: LayersModel;
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
}>("CLASSIFIER_EVALUATE");
export const evaluatedAction = createAction<{
  evaluations: Scalar | Array<Scalar>;
}>("CLASSIFIER_EVALUATED");
export const fitAction = createAction<{
  compiled: LayersModel;
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
  options: FitOptions;
  callback?: any;
}>("CLASSIFIER_FIT");
export const fittedAction = createAction<{
  fitted: LayersModel;
  status: History;
}>("CLASSIFIER_FITTED");
export const generateAction = createAction<{}>("CLASSIFIER_GENERATE");
export const generatedAction = createAction<{
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
}>("CLASSIFIER_GENERATED");
export const openAction = createAction<{
  pathname: string;
  classes: number;
  units: number;
}>("CLASSIFIER_OPEN");
export const openProjectAction = createAction<{ project: Project }>(
  "PROJECT_OPEN_PROJECT"
);
export const openedAction = createAction<{ opened: LayersModel }>(
  "CLASSIFIER_OPENED"
);
export const predictAction = createAction<{
  compiled: LayersModel;
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
}>("CLASSIFIER_PREDICT");
export const predictedAction = createAction<{ predictions: Tensor }>(
  "CLASSIFIER_PREDICTED"
);
export const saveAction = createAction<{}>("CLASSIFIER_SAVE");
export const savedAction = createAction<{}>("CLASSIFIER_SAVED");
export const toggleCategoryVisibilityAction = createAction<{
  category: Category;
}>("PROJECT_TOGGLE_CATEGORY_VISIBILITY");
export const updateBatchSizeAction = createAction<{ batchSize: number }>(
  "CLASSIFIER_UPDATE_BATCH_SIZE"
);
export const updateCategoryColorAction = createAction<{
  category: Category;
  color: string;
}>("PROJECT_UPDATE_CATEGORY_COLOR");
export const updateCategoryDescriptionAction = createAction<{
  category: Category;
  description: string;
}>("PROJECT_UPDATE_CATEGORY_DESCRIPTION");
export const updateCategoryVisibilityAction = createAction<{
  category: Category;
  visible: boolean;
}>("PROJECT_UPDATE_CATEGORY_VISIBILITY");
export const updateEpochsAction = createAction<{ epochs: number }>(
  "CLASSIFIER_UPDATE_EPOCHS"
);
export const updateImageBrightnessAction = createAction<{
  image: Image;
  brightness: number;
}>("PROJECT_UPDATE_IMAGE_BRIGHTNESS");
export const updateImageCategoryAction = createAction<{
  image: Image;
  category: Category;
}>("PROJECT_UPDATE_IMAGE_CATEGORY");
export const updateImageContrastAction = createAction<{
  image: Image;
  contrast: number;
}>("PROJECT_UPDATE_IMAGE_CONTRAST");
export const updateImagesCategoryAction = createAction<{
  images: Array<Image>;
  category: Category;
}>("PROJECT_UPDATE_IMAGES_CATEGORY");
export const updateImagesPartitionsAction = createAction<{
  trainingPercentage: Number;
  validationPercentage: Number;
}>("PROJECT_UPDATE_IMAGES_PARTITIONS");
export const updateImagesVisibilityAction = createAction<{
  images: Array<Image>;
  visible: boolean;
}>("PROJECT_UPDATE_IMAGES_VISIBILITY");
export const updateLearningRateAction = createAction<{ learningRate: number }>(
  "CLASSIFIER_UPDATE_LEARNING_RATE"
);
export const updateLossFunctionAction = createAction<{
  lossFunction: LossFunction;
}>("CLASSIFIER_UPDATE_LOSS_FUNCTION");
export const updateLossHistoryAction = createAction<{
  batch: number;
  loss: number;
}>("CLASSIFIER_UPDATE_LOSS_HISTORY");
export const updateMetricsAction = createAction<{ metrics: Array<Metric> }>(
  "CLASSIFIER_UPDATE_METRICS"
);
export const updateOptimizationFunctionAction = createAction<{
  optimizationAlgorithm: OptimizationAlgorithm;
}>("CLASSIFIER_UPDATE_OPTIMIZATION_FUNCTION");
export const updateProjectNameAction = createAction<{ name: string }>(
  "PROJECT_UPDATE_NAME"
);
export const updateTrainingPercentageAction = createAction<{
  trainingPercentage: number;
}>("CLASSIFIER_UPDATE_TRAINING_PERCENTAGE");
export const updateValidationLossHistoryAction = createAction<{
  batch: number;
  loss: number;
}>("CLASSIFIER_UPDATE_VALIDATION_LOSS_HISTORY");
export const updateValidationPercentageAction = createAction<{
  validationPercentage: number;
}>("CLASSIFIER_UPDATE_VALIDATION_PERCENTAGE");

/*
 * Selectors
 */

export const categoriesCountSelector = ({
  project,
}: {
  project: Project;
}): number => {
  return project.categories.length - 1;
};

export const categoriesSelector = ({
  project,
}: {
  project: Project;
}): Array<Category> => {
  return project.categories.filter((category: Category) => {
    return category.id !== "00000000-0000-0000-0000-00000000000";
  });
};

export const categorizedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images.filter((image: Image) => {
    return image.categoryId !== "00000000-0000-0000-0000-00000000000";
  });
};

export const compileOptionsSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): CompileOptions => {
  return {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationAlgorithm: classifier.optimizationAlgorithm,
  };
};

export const compiledSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): LayersModel => {
  return classifier.compiled!;
};

export const dataSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): Dataset<{ xs: Tensor; ys: Tensor }> => {
  return classifier.data!;
};

export const fitOptionsSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): FitOptions => {
  return classifier.fitOptions;
};

export const fittedSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): LayersModel => {
  return classifier.fitted!;
};

export const generatorOptionsSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): { validationPercentage: number } => {
  return { validationPercentage: classifier.validationPercentage };
};

export const lossHistorySelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): Array<{ x: number; y: number }> => {
  return classifier.lossHistory!;
};

export const openedSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): LayersModel => {
  return classifier.opened!;
};

export const trainingPercentageSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): number => {
  return classifier.trainingPercentage;
};

export const validationDataSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): Dataset<{ xs: Tensor; ys: Tensor }> => {
  return classifier.validationData!;
};

export const validationLossHistorySelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): Array<{ x: number; y: number }> => {
  return classifier.validationLossHistory!;
};

export const validationPercentageSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}): number => {
  return classifier.validationPercentage;
};

/*
 * Sagas
 */

export function* compileSaga(action: any) {
  const { options } = action.payload;

  const opened = yield select(openedSelector);

  const compiled = yield compile(opened, options);

  yield put(compiledAction({ compiled: compiled }));
}

export function* fitSaga(action: any) {
  const { callback } = action.payload;

  const compiled = yield select(compiledSelector);

  const data = yield select(dataSelector);

  const validationData = yield select(validationDataSelector);

  const options = yield select(fitOptionsSelector);

  const { fitted, status } = yield fit(
    compiled,
    data,
    validationData,
    options,
    callback
  );

  yield put(fittedAction({ fitted: fitted, status: status }));
}

export function* generateSaga() {
  const images: Array<Image> = yield select(categorizedImagesSelector);

  const categories: Array<Category> = yield select(categoriesSelector);

  const trainingPercentage = yield select(trainingPercentageSelector);
  const validationPercentage = yield select(validationPercentageSelector);

  yield put(
    updateImagesPartitionsAction({
      trainingPercentage: trainingPercentage,
      validationPercentage: validationPercentage,
    })
  );

  const { data } = yield generate(images, categories);

  yield put(generatedAction({ data: data }));
}

export function* openSaga(action: any) {
  const { pathname, classes, units } = action.payload;

  const opened = yield open(pathname, classes, units);

  yield put(openedAction({ opened: opened }));
}

export function* watchCompileActionSaga() {
  yield takeEvery("CLASSIFIER_COMPILE", compileSaga);
}

export function* watchFitActionSaga() {
  yield takeEvery("CLASSIFIER_FIT", fitSaga);
}

export function* watchGenerateActionSaga() {
  yield takeEvery("CLASSIFIER_GENERATE", generateSaga);
}

export function* watchOpenActionSaga() {
  yield takeEvery("CLASSIFIER_OPEN", openSaga);
}
