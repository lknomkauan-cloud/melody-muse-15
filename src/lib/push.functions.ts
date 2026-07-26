import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tokenSchema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(["web", "android", "ios"]).default("web"),
});

export const registerPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_tokens").upsert(
      {
        user_id: context.userId,
        token: data.token,
        platform: data.platform,
        enabled: true,
      },
      { onConflict: "token" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unregisterPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ token: z.string().min(20) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_tokens")
      .delete()
      .eq("token", data.token)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const sendSchema = z.object({
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(2).max(300),
  link: z.string().trim().max(200).default("/"),
  audience: z.enum(["all", "my_students"]).default("all"),
});

export const sendPushNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: isAdmin }, { data: isTeacher }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "teacher" }),
    ]);
    if (!isAdmin && !isTeacher) throw new Error("Sem permissão para enviar notificações");

    const audience = isAdmin ? data.audience : "my_students";

    let userIds: string[] | null = null;
    if (audience === "my_students") {
      const { data: students, error: studentsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("teacher_id", userId);
      if (studentsError) throw new Error(studentsError.message);
      userIds = (students ?? []).map((s) => s.id);
      if (userIds.length === 0) return { sent: 0, failed: 0, recipients: 0 };
    }

    // RLS scopes this read: admins see all devices, teachers only their students'.
    let query = supabase.from("push_tokens").select("token").eq("enabled", true);
    if (userIds) query = query.in("user_id", userIds);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const tokens = Array.from(new Set((rows ?? []).map((r) => r.token as string)));
    if (tokens.length === 0) return { sent: 0, failed: 0, recipients: 0 };

    const link = data.link.startsWith("/") ? data.link : "/";
    const { sendFcmToTokens } = await import("@/lib/fcm.server");
    const result = await sendFcmToTokens(tokens, data.title, data.body, link);

    if (result.invalidTokens.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("push_tokens").delete().in("token", result.invalidTokens);
    }

    return { sent: result.sent, failed: result.failed, recipients: tokens.length };
  });
