import { formatNutrient, multiplyNutrition } from "@/lib/nutrition";
import { PlateItem } from "@/lib/types";

type PlateItemRowProps = {
  item: PlateItem;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  detailed?: boolean;
};

export function PlateItemRow({ item, onIncrement, onDecrement, onRemove, detailed = false }: PlateItemRowProps) {
  const nutrition = multiplyNutrition(item.nutrition, item.quantity);
  const portion = item.servingSize ?? "serving size unavailable";
  return (
    <article className={`plate-foodCard${detailed ? " is-detailed" : ""}`}>
      <div className="plate-foodHeading">
        <div><h3>{item.name}</h3><p>{item.servingSize ?? "Serving size unavailable"}</p></div>
        <button type="button" aria-label={`Remove ${item.name}, ${portion}`} onClick={() => onRemove(item.itemId)} className="plate-removeItem">Remove</button>
      </div>
      <div className="plate-foodBottom">
        <div className="plate-quantity" aria-label={`Portions of ${item.name}`}>
          <button type="button" aria-label={`Decrease quantity of ${item.name}, ${portion}`} onClick={() => onDecrement(item.itemId)}>−</button>
          <span aria-label={`${item.quantity} portion${item.quantity === 1 ? "" : "s"}`}>{item.quantity}</span>
          <button type="button" disabled={item.quantity >= 999} aria-label={`Increase quantity of ${item.name}, ${portion}`} onClick={() => onIncrement(item.itemId)}>+</button>
        </div>
        {item.isCustom ? <p className="plate-foodUnknown">Nutrition varies</p> : (
          <dl className="plate-foodMacros" aria-label={`Nutrition for ${item.quantity} portion${item.quantity === 1 ? "" : "s"}`}>
            <div><dt className="sr-only">Calories</dt><dd>{formatNutrient(nutrition.calories, " kcal")}</dd></div>
            {detailed ? ([['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat']] as const).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{formatNutrient(nutrition[key], "g")}</dd></div>) : null}
          </dl>
        )}
      </div>
    </article>
  );
}
