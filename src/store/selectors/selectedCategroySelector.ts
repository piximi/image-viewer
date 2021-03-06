import { State } from "../../types/State";
import * as _ from "lodash";
import { Category } from "../../types/Category";

export const selectedCategroySelector = ({ state }: { state: State }) => {
  return _.find(state.categories, (category: Category) => {
    return category.id === state.selectedCategory;
  })!;
};
