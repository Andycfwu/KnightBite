type NutritionDisclaimerProps = {
  className?: string;
};

export function NutritionDisclaimer({ className = "" }: NutritionDisclaimerProps) {
  return (
    <p className={`text-xs leading-5 text-ink/46 ${className}`.trim()}>
      Nutrition values shown as 0 may indicate that data is not publicly available.
    </p>
  );
}
