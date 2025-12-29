
import { useMemo } from 'react';
import { useAgency } from '../context/AgencyContext';
import { QatType, Currency, PaymentStatus } from '../types';

export const useStats = () => {
  const { sales, purchases, debts, expenses, rates, supplierDebts, qatTypes } = useAgency();

  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // تصفية بيانات اليوم
    const todaySalesData = sales.filter(s => s.date.startsWith(today));
    const todayPurchasesData = purchases.filter(p => p.date.startsWith(today));
    const todayExpensesData = expenses.filter(e => e.date.startsWith(today));
    
    const convertToYer = (val: number, currency: string) => {
      if (currency === Currency.SAR) return val * rates.SAR;
      if (currency === Currency.OMR) return val * rates.OMR;
      return val;
    };

    const todaySales = todaySalesData.reduce((sum, s) => sum + (convertToYer(s.total, s.currency) * (s.isReturn ? -1 : 1)), 0);
    const todayPurchases = todayPurchasesData.reduce((sum, p) => sum + (convertToYer(p.totalCost, p.currency) * (p.isReturn ? -1 : 1)), 0);
    const todayExpenses = todayExpensesData.reduce((sum, e) => sum + convertToYer(e.amount, e.currency), 0);
    
    const totalCustomerDebt = debts.reduce((sum, d) => {
      return sum + (d.balances[Currency.YER] || 0) + 
             ((d.balances[Currency.SAR] || 0) * rates.SAR) + 
             ((d.balances[Currency.OMR] || 0) * rates.OMR);
    }, 0);

    const totalSupplierDebt = supplierDebts.reduce((sum, d) => {
      return sum + (d.balances[Currency.YER] || 0) + 
             ((d.balances[Currency.SAR] || 0) * rates.SAR) + 
             ((d.balances[Currency.OMR] || 0) * rates.OMR);
    }, 0);

    // حساب الربحية لكل صنف
    const profitByItem = qatTypes.reduce((acc, type) => {
      const typeSales = sales.filter(s => s.qatType === type);
      const revenue = typeSales.reduce((sum, s) => sum + (convertToYer(s.total, s.currency) * (s.isReturn ? -1 : 1)), 0);
      
      const typePurchases = purchases.filter(p => p.qatType === type);
      const cost = typePurchases.reduce((sum, p) => sum + (convertToYer(p.totalCost, p.currency) * (p.isReturn ? -1 : 1)), 0);
      
      acc[type] = { revenue, cost, profit: revenue - cost };
      return acc;
    }, {} as Record<string, { revenue: number, cost: number, profit: number }>);

    const cashInHandToday = todaySalesData.filter(s => s.status === PaymentStatus.Cash).reduce((sum, s) => sum + s.total, 0);
    const liquidityRatio = totalCustomerDebt > 0 ? (cashInHandToday / (totalCustomerDebt / 30)) : 100;

    const productSales: Record<string, number> = {};
    todaySalesData.forEach(s => {
      productSales[s.qatType] = (productSales[s.qatType] || 0) + s.quantity;
    });
    const topProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0] || ["لا يوجد", 0];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const salesTrend = last7Days.map(date => {
      return sales.filter(s => s.date.startsWith(date))
        .reduce((sum, s) => sum + (convertToYer(s.total, s.currency) * (s.isReturn ? -1 : 1)), 0);
    });

    return {
      todaySales,
      todayPurchases,
      todayExpenses,
      netToday: todaySales - todayExpenses,
      totalCustomerDebt,
      totalSupplierDebt,
      salesTrend,
      liquidityRatio: Math.min(liquidityRatio * 10, 100),
      topProduct: { name: topProduct[0], qty: topProduct[1] },
      profitByItem,
      totalSalesCount: todaySalesData.length,
      rates
    };
  }, [sales, purchases, debts, expenses, rates, supplierDebts, qatTypes]);
};
