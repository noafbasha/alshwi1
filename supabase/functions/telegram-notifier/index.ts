
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { table, type, record, old_record, schema } = payload

    // 1. إنشاء عميل سوبابيس للوصول لإعدادات تليجرام الخاصة بالمستخدم
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userId = record?.user_id || old_record?.user_id
    if (!userId) throw new Error('User ID not found in payload')

    // 2. جلب إعدادات تليجرام الخاصة بالوكالة
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single()

    const settings = profile?.settings?.integrations
    if (!settings?.telegramEnabled || !settings?.telegramBotToken) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. تنسيق الرسالة بناءً على نوع الجدول والعملية
    let actionEmoji = type === 'INSERT' ? '➕ إضافة' : type === 'DELETE' ? '🗑️ حذف' : '📝 تعديل'
    let tableNameAr = table === 'sales' ? 'عملية بيع' : table === 'purchases' ? 'توريد' : table === 'vouchers' ? 'سند مالي' : 'مصروف'
    
    let details = ""
    if (table === 'sales') details = `👤 العميل: ${record?.customer_name}\n📦 الصنف: ${record?.qat_type}\n💰 المبلغ: ${record?.total} ${record?.currency}`
    if (table === 'vouchers') details = `👤 الجهة: ${record?.entity_name}\n💵 المبلغ: ${record?.amount} ${record?.currency}\n📝 البيان: ${record?.notes || 'بدون'}`
    if (table === 'expenses') details = `🏷️ الفئة: ${record?.category}\n💸 المبلغ: ${record?.amount}\n📝 البيان: ${record?.description}`

    const message = `🔔 *إشعار رقابة فورية*\n` +
                    `--------------------------\n` +
                    `📌 *الحدث:* ${actionEmoji} ${tableNameAr}\n` +
                    `${details}\n` +
                    `⏰ *الوقت:* ${new Date().toLocaleString('ar-YE')}\n` +
                    `--------------------------\n` +
                    `🛡️ نظام وكالة الشويع المحاسبي`;

    // 4. الإرسال الفعلي لتليجرام
    await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
