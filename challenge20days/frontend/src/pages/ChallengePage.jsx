import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PixelButton from "../components/PixelButton.jsx";
import { apiFetch } from "../services/api.js";

const logSchema = z
  .object({
    day_number: z.coerce.number().min(1).max(20),
    is_success: z.boolean(),
    comment: z.string().optional(),
    final_comment: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.is_success && val.day_number === 20) {
      const fc = (val.final_comment || "").trim();
      if (!fc) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["final_comment"], message: "Итоговый комментарий обязателен" });
      }
    }
  });

export default function ChallengePage() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [modalDay, setModalDay] = useState(null);

  const load = async () => {
    const data = await apiFetch(`/challenges/${id}`);
    setChallenge(data);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id]);

  const logsByDay = useMemo(() => {
    const m = {};
    if (!challenge?.day_logs) return m;
    challenge.day_logs.forEach((d) => {
      m[d.day_number] = d;
    });
    return m;
  }, [challenge]);

  if (error) {
    return <p className="font-mono text-sm text-rose-700">{error}</p>;
  }
  if (!challenge) {
    return <p className="font-mono text-sm">Загрузка...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="pixel-panel p-6">
        <h1 className="mb-2 font-pixel text-[10px] text-slate-900 sm:text-xs">{challenge.title}</h1>
        <p className="font-mono text-xs text-slate-700">
          Статус: {challenge.status === "completed" ? "завершено" : "в процессе"}
          {challenge.cup && ` · кубок: ${challenge.cup === "golden" ? "золотой" : "медный"}`}
        </p>
        <ul className="mt-3 list-inside list-disc font-mono text-xs text-slate-800">
          {challenge.habits?.map((h) => (
            <li key={h.id}>{h.name}</li>
          ))}
        </ul>
        {challenge.final_comment && (
          <div className="mt-4 border-4 border-slate-900 bg-lime-100 p-3 font-mono text-xs">
            <span className="font-pixel text-[9px] text-slate-900">Итог: </span>
            {challenge.final_comment}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-pixel text-[10px] text-slate-900">20 дней</h2>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((day) => {
            const log = logsByDay[day];
            const locked = challenge.status === "completed";
            const canOpen = !locked;
            let bg = "bg-white";
            if (log?.is_success) bg = "bg-lime-300";
            else if (log && log.is_success === false) bg = "bg-rose-300";
            return (
              <button
                key={day}
                type="button"
                disabled={!canOpen}
                onClick={() => canOpen && setModalDay(day)}
                className={`h-14 border-4 border-slate-900 font-pixel text-[10px] shadow-pixel-sm ${bg} ${
                  canOpen ? "cursor-pointer hover:brightness-95" : "cursor-not-allowed opacity-80"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-[11px] text-slate-600">Нажмите на день, чтобы отметить результат.</p>
      </div>

      {modalDay !== null && (
        <DayModal
          day={modalDay}
          existing={logsByDay[modalDay]}
          onClose={() => setModalDay(null)}
          onSaved={async () => {
            setModalDay(null);
            await load();
          }}
          challengeId={challenge.id}
        />
      )}
    </div>
  );
}

function DayModal({ day, existing, onClose, onSaved, challengeId }) {
  const is20 = day === 20;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm({
    resolver: zodResolver(logSchema),
    defaultValues: {
      day_number: day,
      is_success: existing?.is_success ?? true,
      comment: existing?.comment ?? "",
      final_comment: "",
    },
  });

  const success = watch("is_success");

  const onSubmit = async (vals) => {
    try {
      await apiFetch(`/challenges/${challengeId}/days`, {
        method: "POST",
        body: JSON.stringify({
          day_number: vals.day_number,
          is_success: vals.is_success,
          comment: vals.comment || null,
          final_comment: is20 && vals.is_success ? vals.final_comment?.trim() : null,
        }),
      });
      await onSaved();
    } catch (e) {
      setFormError("root", { message: e.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md border-4 border-slate-900 bg-amber-50 p-6 shadow-pixel">
        <h3 className="mb-3 font-pixel text-[10px]">День {day}</h3>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("day_number", { valueAsNumber: true })} />
          <div className="flex flex-wrap gap-2">
            <PixelButton type="button" variant={success === true ? "primary" : "neutral"} onClick={() => setValue("is_success", true)}>
              Успех
            </PixelButton>
            <PixelButton type="button" variant={success === false ? "danger" : "neutral"} onClick={() => setValue("is_success", false)}>
              Провал
            </PixelButton>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px]">Комментарий к дню</label>
            <textarea className="pixel-input min-h-[80px] font-mono text-xs" {...register("comment")} />
          </div>
          {is20 && success && (
            <div>
              <label className="mb-1 block font-mono text-[11px]">Итоговый комментарий (обязательно при успехе)</label>
              <textarea className="pixel-input min-h-[100px] font-mono text-xs" {...register("final_comment")} />
              {errors.final_comment && (
                <p className="mt-1 font-mono text-xs text-rose-700">{errors.final_comment.message}</p>
              )}
            </div>
          )}
          {errors.root && <p className="font-mono text-xs text-rose-700">{errors.root.message}</p>}
          <div className="flex flex-wrap gap-2">
            <PixelButton type="submit" disabled={isSubmitting}>
              Сохранить
            </PixelButton>
            <PixelButton type="button" variant="neutral" onClick={onClose}>
              Отмена
            </PixelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
