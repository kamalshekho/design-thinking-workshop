/**
 * Kategorien's container: five intents, five endpoints (`API.md`,
 * "Categories"), every one of them awaiting its request.
 *
 * The activation toggle and the rename are the same `PATCH` with a different
 * subset of fields, which is why they are one mutation here and two callbacks
 * on the screen — the screen names what a Staff member did, not what the wire
 * takes.
 *
 * The Applications are read here too, and read-only: Kategorien counts how
 * many Applications name each Category and disables deleting one that any of
 * them does (`A15`). Both counts are computed on this side, which is what
 * `API.md` means by "No counts on a Category".
 */

import { useApplications } from '@/queries/applications';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useEditCategory,
  useReorderCategories,
} from '@/queries/categories';

import { CategoriesScreen } from './CategoriesScreen';

export function CategoriesContainer() {
  const { mutate: create } = useCreateCategory();
  const { mutate: edit } = useEditCategory();
  const { mutate: remove } = useDeleteCategory();
  const { mutate: reorder } = useReorderCategories();
  const categories = useCategories();
  const applications = useApplications();

  return (
    <CategoriesScreen
      categories={categories}
      applications={applications}
      onCreate={(draft) => {
        create(draft);
      }}
      onEdit={(id, draft) => {
        edit({ id, change: draft });
      }}
      onSetActive={(id, active) => {
        edit({ id, change: { active } });
      }}
      onDelete={(id) => {
        remove(id);
      }}
      onReorder={(orderedIds) => {
        reorder(orderedIds);
      }}
    />
  );
}
