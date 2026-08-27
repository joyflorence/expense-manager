export const DEFAULT_MONTHLY_SALARY = 500000;
const LEGACY_INCORRECT_MONTHLY_SALARY = 1500000;

export function normalizeMonthlySalary(value?: number): number {
  const salary = Number(value);

  if (!Number.isFinite(salary) || salary <= 0) {
    return DEFAULT_MONTHLY_SALARY;
  }

  return salary === LEGACY_INCORRECT_MONTHLY_SALARY ? DEFAULT_MONTHLY_SALARY : salary;
}
