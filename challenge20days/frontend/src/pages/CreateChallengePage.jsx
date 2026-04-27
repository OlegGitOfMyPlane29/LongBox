import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import PixelButton from "../components/PixelButton.jsx";
import { apiFetch } from "../services/api.js";

const habitSchema = z.object({ name: z.string() });
const schema = z.object({
  title: z.string().min(1, "Название испытания"),
  habits: z.array(habitSchema).min(1, "Добавьте хотя бы одну строку").max(3, "Максимум 3 привычки"),
});

export default function CreateChallengePage() {
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      habits: [{ name: "" }, { name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "habits" });

  const onSubmit = async (data) => {
    const habits = data.habits.map((h) => ({ name: h.name.trim() })).filter((h) => h.name.length > 0);
    if (habits.length < 1 || habits.length > 3) {
      setFormError("root", { message: "Нужно от 1 до 3 непустых привычек" });
      return;
    }
    try {
      const created = await apiFetch("/challenges", {
        method: "POST",
        body: JSON.stringify({ title: data.title.trim(), habits }),
      });
      navigate(`/challenges/${created.id}`);
    } catch (e) {
      setFormError("root", { message: e.message });
    }
  };

  return (
    <div className="mx-auto max-w-lg pixel-panel p-6">
      <h1 className="mb-6 font-pixel text-xs text-slate-900">Новое испытание</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-1 block font-mono text-xs">Название</label>
          <input className="pixel-input" {...register("title")} />
          {errors.title && <p className="mt-1 font-mono text-xs text-rose-700">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs">Привычки (до 3)</span>
            {fields.length < 3 && (
              <button
                type="button"
                className="border-2 border-slate-900 bg-lime-200 px-2 py-1 font-mono text-[10px] shadow-pixel-sm"
                onClick={() => append({ name: "" })}
              >
                + строка
              </button>
            )}
          </div>
          {fields.map((f, index) => (
            <div key={f.id} className="flex gap-2">
              <input className="pixel-input flex-1" placeholder={`Привычка ${index + 1}`} {...register(`habits.${index}.name`)} />
              {fields.length > 1 && (
                <button
                  type="button"
                  className="border-2 border-slate-900 bg-rose-200 px-2 font-mono text-xs"
                  onClick={() => remove(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {errors.habits && <p className="font-mono text-xs text-rose-700">{errors.habits.message}</p>}
        </div>
        {errors.root && <p className="font-mono text-xs text-rose-700">{errors.root.message}</p>}
        <PixelButton type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "..." : "Создать"}
        </PixelButton>
      </form>
    </div>
  );
}
