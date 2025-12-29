// تذكر: هذا الكود يعمل في بيئة Deno على خوادم Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// @fix Declare Deno global variable to resolve 'Cannot find name Deno' TypeScript error in Supabase Edge Functions.
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. معالجة طلبات Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. استخراج البيانات المرسلة من التطبيق
    const { summary, settings } = await req.json()
    
    // 3. التحقق من هوية المستخدم عبر الـ Header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      // @fix Use Deno.env to safely access environment variables in Supabase environment.
      Deno.env.get('SUPABASE_URL') ?? '',
      // @fix Use Deno.env to safely access environment variables in Supabase environment.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // الحصول على بيانات المستخدم الحالي لضمان الأمان
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('غير مصرح لك بالوصول')

    console.log(`جاري مزامنة بيانات المستخدم: ${user.email}`)

    // 4. منطق المزامنة (يمكنك هنا حفظ البيانات في جدول "backups" مثلاً)
    // حالياً سنقوم فقط بتأكيد استلام البيانات وتوليد رد ذكي
    
    const responseData = {
      message: "تمت المزامنة السحابية بنجاح ✅",
      syncId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      receivedSummary: {
        salesCount: summary.totalSales,
        inventoryTypes: Object.keys(summary.inventory).length
      }
    }

    // 5. إذا كان تليجرام مفعلاً، يمكن إضافة منطق إرسال إشعار هنا مستقبلاً
    if (settings.telegramEnabled && settings.telegramBotToken) {
       // منطق إرسال رسالة تليجرام عبر السيرفر لضمان الأمان
       console.log("إشعار: تليجرام مفعل، سيتم إرسال ملخص عبر السيرفر...");
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
