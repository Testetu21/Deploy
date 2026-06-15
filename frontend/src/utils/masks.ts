export function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  return numbers
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{1})(\d{4})(\d{4})$/, "$1 $2-$3");
}


export function isValidBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 10 && digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const ddd = Number(digits.slice(0, 2));
  const number = digits.slice(2);

  if (ddd < 11 || ddd > 99) return false;
  if (/^(\d)\1+$/.test(number)) return false;

  // Celular brasileiro deve ter 11 dígitos e começar com 9 depois do DDD.
  if (digits.length === 11 && digits[2] !== "9") return false;

  // Telefone fixo com 10 dígitos não deve começar com 0 ou 1 depois do DDD.
  if (digits.length === 10 && !/[2-9]/.test(digits[2])) return false;

  return true;
}

export function formatCPF(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCNPJ(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 14);

  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatCpfCnpj(value: string) {
  const numbers = value.replace(/\D/g, "");
  return numbers.length > 11 ? formatCNPJ(numbers) : formatCPF(numbers);
}

export function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits) / 100;
  return formatCurrencyValue(num);
}

export function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export function formatNumberInput(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");
  return maxLength ? digits.slice(0, maxLength) : digits;
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}
