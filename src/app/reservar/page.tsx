"use client";

import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Send, User, Phone, Clock, UserCheck, AlertTriangle, Loader2 } from "lucide-react";
import { createOrderAction } from "@/app/actions/orders";
import { useToast } from "@/context/ToastContext"; 

export default function ReservarPage() {
  const { data: session, status } = useSession();
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [tiendaAbierta, setTiendaAbierta] = useState<boolean>(true);
  const [horario, setHorario] = useState({ min: "09:00", max: "19:00" });
  const [formData, setFormData] = useState({ whatsapp: "", quienRecoge: "", horaRecojo: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/reservar");
    
    const fetchYEscuchar = async () => {
      const { data } = await supabase.from('configuracion').select('*').eq('id', 1).single();
      if (data) {
        setTiendaAbierta(data.tienda_abierta);
        setHorario({ min: data.horario_apertura.slice(0, 5), max: data.horario_cierre.slice(0, 5) });
      }

      supabase.channel('reserva-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracion' }, 
          (payload) => {
            setTiendaAbierta(payload.new.tienda_abierta);
            setHorario({ 
              min: payload.new.horario_apertura.slice(0, 5), 
              max: payload.new.horario_cierre.slice(0, 5) 
            });
          }
        ).subscribe();
    };
    fetchYEscuchar();
  }, [status, router]);

  if (status === "loading" || !session) return <div className="min-h-screen bg-[#050505]" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tiendaAbierta) {
      toast("La tienda está cerrada, no se pueden recibir pedidos.", "error");
      return;
    }
    
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
        toast(`¡Pedido #${result.orderId} confirmado con éxito!`, "success");
        router.push("/"); 
      } else {
        toast(result.message || "Error al procesar el pedido", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Ocurrió un error inesperado al enviar el pedido.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {!tiendaAbierta && (
            <div className="mb-8 p-6 bg-red-600 text-white rounded-3xl font-bold flex items-center justify-center gap-4 animate-pulse shadow-xl">
              <AlertTriangle size={32} />
              <p className="uppercase tracking-widest text-center">Recepción de pedidos cerrada por hoy</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className={`lg:col-span-2 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border transition-all ${!tiendaAbierta ? "opacity-40 pointer-events-none" : "border-gray-100"}`}>
              <h2 className="font-serif italic text-4xl text-gris mb-8">Confirmar Recojo</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><User size={12}/> Tu Nombre</label>
                    <input type="text" disabled value={session.user?.name || ""} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Phone size={12}/> WhatsApp</label>
                    <input type="tel" required onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-4 border border-gray-100 rounded-2xl outline-none focus:border-[#C5A059]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><UserCheck size={12}/> Persona que recoge</label>
                  <input type="text" required onChange={(e) => setFormData({...formData, quienRecoge: e.target.value})} className="w-full p-4 border border-gray-100 rounded-2xl outline-none focus:border-[#C5A059]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Clock size={12}/> Hora de Recojo (Hoy)</label>
                  <input type="time" required min={horario.min} max={horario.max} onChange={(e) => setFormData({...formData, horaRecojo: e.target.value})} className="w-full p-4 border border-gray-100 rounded-2xl outline-none focus:border-[#C5A059]" />
                  <p className="text-[10px] text-[#C5A059] font-bold italic mt-2">* Horario de hoy: {horario.min} a {horario.max}</p>
                </div>
                <button 
                  disabled={!tiendaAbierta || isSubmitting} 
                  className={`w-full py-6 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${tiendaAbierta ? "bg-[#C5A059] text-white hover:bg-[#b38f4d]" : "bg-gray-300 text-gray-500"}`}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {tiendaAbierta ? `Confirmar Pedido • Bs ${total}` : "Tienda Cerrada"}
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white h-fit">
              <h3 className="font-serif italic text-2xl text-gris mb-6">Tu pedido</h3>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-white">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0"><Image src={item.foto || "/portada.jpg"} alt={item.nombre} fill className="object-cover" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold uppercase truncate">{item.nombre}</p>
                    <p className="text-xs text-[#C5A059]">Bs {item.precio} x {item.cantidad}</p>
                    {item.personalizacion && (
                      <div className="mt-1 flex flex-wrap gap-1">
                         <span className="px-1.5 py-0.5 bg-[#C5A059]/10 text-[#C5A059] text-[9px] rounded font-bold uppercase tracking-wider">
                           Personalizado
                         </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-6 flex justify-between text-xl font-bold text-gris">
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