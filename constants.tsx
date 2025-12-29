
import { QatType, Currency, PaymentStatus, Customer, Sale, ExchangeRate } from './types';

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'general', name: 'عميل عام', phone: '000000000', address: 'مبيعات نقدية مباشرة' },
  { id: '1', name: 'أحمد الحداد', phone: '777123456', address: 'صنعاء - التحرير' },
  { id: '2', name: 'محمد الشامي', phone: '771234567', address: 'صنعاء - السبعين' },
  { id: '3', name: 'علي العديني', phone: '773456789', address: 'عدن - كريتر' },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 's1',
    date: new Date().toISOString(),
    customerId: '1',
    customerName: 'أحمد الحداد',
    qatType: QatType.Burai,
    quantity: 2,
    unitPrice: 20000,
    total: 40000,
    currency: Currency.YER,
    status: PaymentStatus.Cash
  },
  {
    id: 's2',
    date: new Date().toISOString(),
    customerId: '3',
    customerName: 'علي العديني',
    qatType: QatType.Bardoni,
    quantity: 1,
    unitPrice: 15000,
    total: 15000,
    currency: Currency.YER,
    status: PaymentStatus.Credit
  }
];

export const INITIAL_RATES: ExchangeRate = {
  SAR: 430,
  OMR: 425,
  date: new Date().toLocaleDateString('en-CA')
};
