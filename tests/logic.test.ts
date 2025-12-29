import { Currency, PaymentStatus, Sale, Purchase } from '../types';

/**
 * وظيفة افتراضية لمحاكاة حساب المخزون
 */
function calculateInventory(purchases: Purchase[], sales: Sale[]) {
  const totalIn = purchases.reduce((sum, p) => sum + (p.isReturn ? -p.quantity : p.quantity), 0);
  const totalOut = sales.reduce((sum, s) => sum + (s.isReturn ? -s.quantity : s.quantity), 0);
  return totalIn - totalOut;
}

/**
 * اختبارات المخزون
 */
export const testInventoryLogic = () => {
  console.log("🧪 جاري اختبار منطق المخزون...");

  const mockPurchases: Purchase[] = [
    { id: '1', quantity: 10, qatType: 'برعي', isReturn: false, supplierId: 's1', supplierName: 's', costPrice: 1, totalCost: 10, currency: Currency.YER, status: PaymentStatus.Cash, date: '' }
  ];

  const mockSales: Sale[] = [
    { id: '1', quantity: 3, qatType: 'برعي', isReturn: false, customerId: 'c1', customerName: 'c', unitPrice: 2, total: 6, currency: Currency.YER, status: PaymentStatus.Cash, date: '' }
  ];

  const result = calculateInventory(mockPurchases, mockSales);
  
  if (result === 7) {
    console.log("✅ اختبار المخزون نجح: (10 - 3 = 7)");
  } else {
    console.error(`❌ اختبار المخزون فشل: المتوقع 7 والحقيقي ${result}`);
  }
};

/**
 * اختبارات الديون
 */
export const testDebtLogic = () => {
  console.log("🧪 جاري اختبار منطق مديونية العملاء...");
  // يمكن إضافة منطق مشابه هنا
};
