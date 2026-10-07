import type { ProductOption } from "../data/types";
import styles from "./ProductOptions.module.css";

/**
 * Native radio groups inside a <form> with no submit yet: 3B.2 adds "Add to bag" here and
 * reads the selection as form data. Each colour value with its own image carries
 * `data-colourway` (1-based), which ProductGallery's images match.
 */
export function ProductOptions({ options }: { options: readonly ProductOption[] }) {
  return (
    <form className={styles.form}>
      {options.map((option) => {
        const name = option.name.toLowerCase();
        return (
          <fieldset key={option.name} className={styles.fieldset}>
            <legend className={styles.legend}>{option.name}</legend>
            <div className={styles.values}>
              {option.values.map((value, index) => (
                <label key={value.id} className={styles.value}>
                  <input
                    type="radio"
                    name={name}
                    value={value.id}
                    defaultChecked={index === 0}
                    data-colourway={value.image ? index + 1 : undefined}
                    className={styles.radio}
                  />
                  {value.swatch && (
                    <span
                      className={styles.swatch}
                      style={{ backgroundColor: value.swatch }}
                      aria-hidden="true"
                    />
                  )}
                  {value.label}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <p className={styles.note}>Cart and checkout arrive in the next phase of this demo.</p>
    </form>
  );
}
