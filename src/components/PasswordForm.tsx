"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { updatePasswordAction } from "@/app/perfil/actions";

export default function PasswordForm({ email, hasPassword }: { email: string, hasPassword: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage({ type: 'error', text: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await updatePasswordAction(email, password);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setPassword("");
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 mt-8">
      <div className="flex items-center gap-2 text-gray-400 mb-4">
        <Lock size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {hasPassword ? "Cambiar Contraseña" : "Establecer Contraseña"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-5 text-gris outline-none focus:border-[#C5A059] transition-all pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C5A059] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {message && (
          <p className={`text-xs font-bold uppercase tracking-tighter ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C5A059] text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#b38f4d] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/20"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : (hasPassword ? "Actualizar" : "Guardar Contraseña")}
        </button>
      </form>
    </div>
  );
}