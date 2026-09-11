type NutritionDisclaimerProps = {
  className?: string;
};

export function NutritionDisclaimer({ className = "" }: NutritionDisclaimerProps) {
  return (
    <p className={`text-xs leading-5 text-ink/46 ${className}`.trim()}>
      Unknown means Rutgers did not provide a usable value. Known subtotals exclude missing or variable nutrition; zero is shown only when supplied.
    </p>
  );
}
