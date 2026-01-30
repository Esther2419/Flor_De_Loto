"use client";

import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Send, User, Phone, Clock, UserCheck, AlertTriangle, Loader2, Trash2, Tag } from "lucide-react";
import { createOrderAction } from "@/app/actions/orders";
import { useToast } from "@/context/ToastContext"; 
import { format } from "date-fns";

export default function ReservarPage() {
  const { data: session, status } = useSession();
  const { items, total, clearCart, removeFromCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [tiendaAbierta, setTiendaAbierta] = useState<boolean>(true);
  const [horario, setHorario] = useState({ min: "09:00", max: "19:00" });
  const [formData, setFormData] = useState({ whatsapp: "", quienRecoge: "", horaRecojo: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeStr = (timeStr: string) => {
    try {
      return format(new Date(`2000-01-01T${timeStr}`), "hh:mm aa");
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/reservar");
    
    const fetchYEscuchar = async () => {
      const { data } = await supabase.from('configuracion').select('*').eq('id', 1).single();
      if (data) {
        setTiendaAbierta(data.tienda_abierta);
        setHorario({ min: data.horario_apertura.slice(0, 5), max: data.horario_cierre.slice(0, 5) });
      }
    };
    fetchYEscuchar();
  }, [status, router]);

  if (status === "loading" || !session) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !tiendaAbierta) return;
    setIsSubmitting(true);
    try {
      const result = await createOrderAction({
        nombre_contacto: session.user?.name || "Cliente",
        telefono_contacto: formData.whatsapp,
        fecha_entrega: new Date().toISOString(),
        quien_recoge: formData.quienRecoge,
        hora_recojo: formData.horaRecojo,
        total: total,
        items: items
      });
      if (result.success) {
        clearCart();
        toast(`¡Pedido #${result.orderId} confirmado!`, "success");
        router.push("/mis-pedidos"); 
      }
    } catch (error) {
      toast("Error al procesar el pedido", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* FORMULARIO */}
            <div className={`lg:col-span-2 bg-white p-8 md:p-12 rounded-[2.5rem] border ${!tiendaAbierta ? "opacity-40" : "border-gray-100 shadow-sm"}`}>
              <h2 className="font-serif italic text-4xl text-gris mb-8">Confirmar Recojo</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">WhatsApp</label>
                    <input type="tel" required placeholder="70000000" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-4 border rounded-2xl outline-none focus:border-[#C5A059]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Persona que recoge</label>
                    <input type="text" required placeholder="Nombre completo" onChange={(e) => setFormData({...formData, quienRecoge: e.target.value})} className="w-full p-4 border rounded-2xl outline-none focus:border-[#C5A059]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hora de Recojo (Hoy)</label>
                  <input type="time" required min={horario.min} max={horario.max} onChange={(e) => setFormData({...formData, horaRecojo: e.target.value})} className="w-full p-4 border rounded-2xl outline-none focus:border-[#C5A059]" />
                  <p className="text-[10px] text-[#C5A059] font-bold italic mt-2">* Horario: {formatTimeStr(horario.min)} a {formatTimeStr(horario.max)}</p>
                </div>
                <button disabled={!tiendaAbierta || isSubmitting || items.length === 0} className="w-full py-6 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 bg-[#C5A059] text-white hover:bg-[#b38f4d] transition-all">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Confirmar Pedido • Bs {total} <Send size={16} /></>}
                </button>
              </form>
            </div>

            {/* RESUMEN DEL PEDIDO CON INDICADORES DE OFERTA */}
            <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white h-fit shadow-sm">
              <h3 className="font-serif italic text-2xl text-gris mb-6">Tu pedido</h3>
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b border-white group">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white">
                      <Image src={item.foto || "/portada.jpg"} alt={item.nombre} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold uppercase truncate pr-2 flex items-center gap-1">
                          {item.nombre}
                          {item.esOferta && <span className="bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black">OFERTA</span>}
                        </p>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-bold ${item.esOferta ? 'text-red-600' : 'text-[#C5A059]'}`}>
                          Bs {item.precio} x {item.cantidad}
                        </p>
                        {item.esOferta && item.precioOriginal && (
                          <p className="text-[9px] text-gray-400 line-through italic">Bs {item.precioOriginal}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 flex justify-between items-center text-xl font-bold text-gris">
                <span className="font-serif italic text-2xl">Total</span>
                <span className="text-[#C5A059]">Bs {total}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}