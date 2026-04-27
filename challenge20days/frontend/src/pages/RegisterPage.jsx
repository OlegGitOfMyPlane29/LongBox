import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import PixelButton from "../components/PixelButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const schema = z.object({
  email: z.string().email("Некорректный email"),
  username: z.string().min(2, "Минимум 2 символа"),
  password: z.string().min(8, "Минимум 8 символов"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data.email, data.username, data.password);
      navigate("/dashboard");
    } catch (e) {
      setFormError("root", { message: e.message || "Ошибка регистрации" });
    }
  };

  return (
    <div className="mx-auto max-w-md pixel-panel p-6">
      <h1 className="mb-6 font-pixel text-xs text-slate-900">Регистрация</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-1 block font-mono text-xs">Email</label>
          <input className="pixel-input" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="mt-1 font-mono text-xs text-rose-700">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs">Имя пользователя</label>
          <input className="pixel-input" autoComplete="username" {...register("username")} />
          {errors.username && <p className="mt-1 font-mono text-xs text-rose-700">{errors.username.message}</p>}
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs">Пароль</label>
          <input className="pixel-input" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="mt-1 font-mono text-xs text-rose-700">{errors.password.message}</p>}
        </div>
        {errors.root && <p className="font-mono text-xs text-rose-700">{errors.root.message}</p>}
        <PixelButton type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "..." : "Создать аккаунт"}
        </PixelButton>
      </form>
      <p className="mt-4 text-center font-mono text-xs">
        Уже есть аккаунт?{" "}
        <Link className="underline" to="/login">
          Вход
        </Link>
      </p>
    </div>
  );
}
