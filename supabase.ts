
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// تأمين الوصول لمتغيرات البيئة
const getEnv = (key: string, fallback: string) => {
  try {
    return (process.env && process.env[key]) || fallback;
  } catch {
    return fallback;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://fgwysuebvmogbfesbosn.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnd3lzdWVidm1vZ2JmZXNib3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTQ0MzksImV4cCI6MjA4MjQ3MDQzOX0.8ijoTs3f3WbVJr3Qw7NsvMwQDpRMnrvKdceXALw2opU');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isConfigured = true;

export const getSafeErrorMessage = (err: any): string => {
  if (typeof err === 'string') return err;
  if (err?.code === '23503') return 'خطأ في الربط: الكيان المستهدف غير موجود';
  if (err?.code === '23505') return 'هذا السجل موجود مسبقاً';
  return err?.message || err?.error_description || 'حدث خطأ في الاتصال بالسحابة';
};

/**
 * دالة مساعدة لرفع الملفات إلى Supabase Storage
 */
export const uploadReceipt = async (userId: string, file: File, folder: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Storage Error:", error);
    return null;
  }
};
