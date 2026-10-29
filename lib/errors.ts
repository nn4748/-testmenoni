import type { ApiError } from "./types";

// رسائل الخطأ اللي تظهر للطالب، كلها بالعربي.
export const MESSAGES = {
  no_file: "ما وصلنا أي ملف. اختر ملف PDF وحاول مرة ثانية.",
  not_pdf: "الملف لازم يكون بصيغة PDF.",
  too_large: "حجم الملف أكبر من 20 ميجا. جرّب ملف أصغر أو قسّمه.",
  empty_text:
    "ما قدرنا نقرأ نص من الملف. غالبًا الملزمة صور ممسوحة (سكانر)، جرّب تلصق النص بدلها.",
  too_short: "النص قصير مرة. نحتاج على الأقل فقرة أو فقرتين عشان نطلع لك مواد مذاكرة.",
  pdf_failed: "صار خطأ وحنا نقرأ الملف. تأكد إنه PDF سليم ومو محمي بكلمة مرور.",
  network: "فيه مشكلة في الاتصال. تأكد من الإنترنت وحاول مرة ثانية.",
  bad_request: "الطلب ناقص. ارجع للصفحة الرئيسية وارفع الملزمة مرة ثانية.",
  text_too_long: "الملزمة طويلة مرة (أكثر من 600 ألف حرف). قسّمها على أكثر من ملف.",
  no_api_key: "الخدمة مو مضبوطة: مفتاح Claude ناقص أو غلط في إعدادات السيرفر.",
  busy: "الخدمة عليها ضغط الحين. انتظر دقيقة وحاول مرة ثانية.",
  ai_unreachable: "ما قدرنا نوصل لخدمة الذكاء الاصطناعي. حاول بعد شوي.",
  refused: "ما قدرنا نولّد مواد من هذا المحتوى. جرّب ملزمة ثانية.",
  too_long: "المحتوى أطول من اللي نقدر نعالجه بطلب واحد. جرّب جزء أصغر من الملزمة.",
  bad_output: "طلع رد غير مكتمل من الذكاء الاصطناعي. اضغط \"حاول مرة ثانية\".",
  unknown: "صار خطأ غير متوقع. حاول مرة ثانية.",
} as const;

export type ErrorCode = keyof typeof MESSAGES;

export function errorBody(code: ErrorCode): ApiError {
  return { error: code, message: MESSAGES[code] };
}

export function errorResponse(code: ErrorCode, status: number) {
  return Response.json(errorBody(code), { status });
}

export class AppError extends Error {
  constructor(public code: ErrorCode) {
    super(MESSAGES[code]);
  }
}
