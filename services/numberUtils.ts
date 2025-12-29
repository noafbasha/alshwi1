
/**
 * دالة لتحويل الأرقام إلى كلمات باللغة العربية (تفقيط)
 */
export const tafqit = (n: number, currency: string = "ريال يمني"): string => {
  if (n === 0) return "صفر";
  
  const absN = Math.abs(n);
  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  const formatPart = (num: number): string => {
    if (num === 0) return "";
    if (num < 11) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return (num % 10 !== 0 ? units[num % 10] + " و" : "") + tens[Math.floor(num / 10)];
    if (num < 1000) return hundreds[Math.floor(num / 100)] + (num % 100 !== 0 ? " و" + formatPart(num % 100) : "");
    
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      let text = "";
      if (thousands === 1) text = "ألف";
      else if (thousands === 2) text = "ألفان";
      else if (thousands <= 10) text = formatPart(thousands) + " آلاف";
      else text = formatPart(thousands) + " ألف";
      return text + (remainder !== 0 ? " و" + formatPart(remainder) : "");
    }

    if (num < 1000000000) {
        const millions = Math.floor(num / 1000000);
        const remainder = num % 1000000;
        let text = "";
        if (millions === 1) text = "مليون";
        else if (millions === 2) text = "مليونان";
        else if (millions <= 10) text = formatPart(millions) + " ملايين";
        else text = formatPart(millions) + " مليون";
        return text + (remainder !== 0 ? " و" + formatPart(remainder) : "");
    }

    return num.toString();
  };

  const result = formatPart(Math.floor(absN));
  return `فقط ${result} ${currency} لا غير`;
};
