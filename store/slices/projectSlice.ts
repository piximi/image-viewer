import { Project } from "../../types/Project";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category } from "../../types/Category";
import { v4 } from "uuid";
import { Image } from "../../types/Image";
import { findIndex } from "underscore";

const initialState: Project = {
  categories: [
    {
      color: "rgb(255, 255, 0)",
      id: "00000000-0000-0000-0000-000000000000",
      name: "Unknown",
      visible: true,
    },
  ],
  images: [],
  name: "Untitled project",
};

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    createProjectCategoryAction(
      state: Project,
      action: PayloadAction<{ name: string; color: string }>
    ) {
      const category: Category = {
        color: action.payload.color,
        id: v4().toString(),
        name: action.payload.name,
        visible: true,
      };

      state.categories.push(category);
    },
    createProjectImageAction(
      state: Project,
      action: PayloadAction<{ src: string }>
    ) {
      const image: Image = {
        id: v4(),
        name: "",
        src: action.payload.src,
        categoryId: "00000000-0000-0000-0000-000000000000",
      };

      state.images.push(image);
    },
    createProjectAction(
      state: Project,
      action: PayloadAction<{ project: Project }>
    ) {
      state.categories = action.payload.project.categories;

      state.name = action.payload.project.name;

      state.images = action.payload.project.images;
    },
    updateCategoryAction(
      state: Project,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      const index = findIndex(state.categories, (category: Category) => {
        return category.id === action.payload.id;
      });

      state.categories[index].name = action.payload.name;

      state.categories[index].color = action.payload.color;
    },
    updateCategoryVisibilityAction(
      state: Project,
      action: PayloadAction<{ id: string; visible: boolean }>
    ) {
      const index = findIndex(state.categories, (category: Category) => {
        return category.id === action.payload.id;
      });

      state.categories[index].visible = action.payload.visible;
    },
    updateImageCategoryAction(
      state: Project,
      action: PayloadAction<{ id: string; categoryId: string }>
    ) {
      const index = findIndex(state.images, (image: Image) => {
        return image.id === action.payload.id;
      });

      if (index >= 0) {
        state.images[index].categoryId = action.payload.categoryId;
      }
    },
  },
});
