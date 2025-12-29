
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";

export const agencyFunctions: FunctionDeclaration[] = [
  {
    name: 'add_sale_command',
    parameters: {
      type: Type.OBJECT,
      description: 'تسجيل عملية بيع لعميل (كاش أو آجل).',
      properties: {
        customerName: { type: Type.STRING, description: 'اسم العميل' },
        qatType: { type: Type.STRING, description: 'نوع الصنف' },
        quantity: { type: Type.NUMBER, description: 'الكمية بالحزم' },
        unitPrice: { type: Type.NUMBER, description: 'سعر الحزمة' },
        currency: { type: Type.STRING, description: 'العملة: YER, SAR, OMR' },
        status: { type: Type.STRING, description: 'الحالة: "نقدي" أو "آجل"' }
      },
      required: ['customerName', 'qatType', 'quantity', 'unitPrice', 'status']
    }
  },
  {
    name: 'set_opening_balance_command',
    parameters: {
      type: Type.OBJECT,
      description: 'تسجيل دين قديم أو رصيد افتتاح لعميل أو مورد.',
      properties: {
        entityName: { type: Type.STRING, description: 'اسم العميل أو المورد' },
        amount: { type: Type.NUMBER, description: 'مبلغ الدين القديم' },
        entityType: { type: Type.STRING, description: 'النوع: "عميل" أو "مورد"' },
        date: { type: Type.STRING, description: 'تاريخ المديونية (اختياري)' }
      },
      required: ['entityName', 'amount', 'entityType']
    }
  },
  {
    name: 'add_purchase_command',
    parameters: {
      type: Type.OBJECT,
      description: 'تسجيل عملية توريد (شراء) من مورد للمخزن.',
      properties: {
        supplierName: { type: Type.STRING, description: 'اسم المورد' },
        qatType: { type: Type.STRING, description: 'نوع القات الوارد' },
        quantity: { type: Type.NUMBER, description: 'الكمية المستلمة' },
        costPrice: { type: Type.NUMBER, description: 'سعر التكلفة للحزمة' },
        currency: { type: Type.STRING, description: 'العملة: YER, SAR, OMR' },
        status: { type: Type.STRING, description: 'الحالة: "نقدي" أو "آجل"' }
      },
      required: ['supplierName', 'qatType', 'quantity', 'costPrice', 'status']
    }
  }
];

export interface AssistantResponse {
  text: string;
  functionCalls?: any[];
  extractedData?: any;
}

/**
 * دالة المسح الذكي للفواتير والدفاتر اليدوية
 */
export async function scanInvoiceWithAi(base64Image: string, isLedger: boolean = false): Promise<AssistantResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = isLedger 
    ? `حلل صورة صفحة الدفتر اليدوي هذه واستخرج كافة العمليات المالية المذكورة فيها.
       حول كل عملية إلى كائن JSON يحتوي على: (entityName, type: "sale"|"purchase"|"payment", amount, notes).
       أجب بتنسيق JSON فقط.`
    : `حلل صورة هذه الفاتورة واستخرج البيانات التالية بدقة في تنسيق JSON:
       - اسم المورد (supplierName)
       - نوع القات (qatType)
       - الكمية الإجمالية (quantity)
       - السعر الإجمالي (totalCost)
       - العملة (currency)
       إذا لم تكن متأكداً، ضع قيم فارغة.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }]
    });

    const jsonText = response.text || '{}';
    const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    return { text: isLedger ? "تم تحليل الدفتر بنجاح" : "تم المسح بنجاح", extractedData: JSON.parse(cleanJson) };
  } catch (err) {
    console.error("OCR Error:", err);
    throw new Error("فشل في معالجة الصورة ذكياً.");
  }
}

/**
 * التنبؤ المالي باستخدام بيانات الأسبوع الماضي
 */
export async function getFinancialForecast(stats: any): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `بناءً على البيانات التالية لآخر 7 أيام لوكالة قات:
    مبيعات يومية: ${JSON.stringify(stats.salesTrend)}
    أصناف أكثر مبيعاً: ${stats.topProduct.name}
    ديون حالية: ${stats.totalCustomerDebt}
    توقع مبيعات الأسبوع القادم وقدم نصيحة استراتيجية لتقليل الديون وزيادة السيولة بلهجة يمنية مهذبة.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    return response.text || "عذراً، لم أستطع توليد التوقعات حالياً.";
  } catch (err) {
    return "فشل الاتصال بمحرك التوقعات الذكي.";
  }
}

export async function askBusinessAssistant(prompt: string, context: any, imageData?: { data: string; mimeType: string }): Promise<AssistantResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `أنت المدير التنفيذي ومرشد النظام لوكالة الشويع للقات. 
  وظيفتك هي تنفيذ الأوامر بدقة بلهجة يمنية. 
  إذا سألك المستخدم "كيف أستخدم البرنامج؟" أو أي سؤال حول ميزة معينة، اشرح له ببساطة:
  1. البيع (Sales): لتسجيل مبيعات الكاش والآجل.
  2. الديون (Debts): لمتابعة ديون العملاء والمطالبة الصوتية.
  3. اليومية (Journal): لمراجعة كافة العمليات وحذف الخطأ.
  4. الإغلاق (Closing): لجرد الصندوق وترحيل الوردية سحابياً.
  5. المخزن (Inventory): لمتابعة كميات القات المتبقية.
  كن ودوداً جداً واستخدم عبارات مثل 'يا مدير' و 'أبشر من عيوني'.`;

  const parts: any[] = [{ text: prompt }];
  if (imageData) parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: { systemInstruction, tools: [{ functionDeclarations: agencyFunctions }] }
    });
    return { text: response.text || '', functionCalls: response.functionCalls };
  } catch (err) { 
    console.error("AI Assistant Error:", err);
    throw new Error("مشكلة في المعالجة الذكية."); 
  }
}
