"use client";

import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Send, User, Phone, Clock, UserCheck, AlertTriangle } from "lucide-react";

export default function ReservarPage() {
  const { data: session, status } = useSession();
  const { items, total } = useCart();
  const router = useRouter();

  const [tiendaAbierta, setTiendaAbierta] = useState<boolean>(true);
  const [horario, setHorario] = useState({ min: "09:00", max: "19:00" });
  const [formData, setFormData] = useState({ whatsapp: "", quienRecoge: "", horaRecojo: "" });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tiendaAbierta) return;
    alert("¡Reserva confirmada! Te esperamos hoy.");
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
                <button disabled={!tiendaAbierta} className={`w-full py-6 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${tiendaAbierta ? "bg-[#C5A059] text-white hover:bg-[#b38f4d]" : "bg-gray-300 text-gray-500"}`}>
                  {tiendaAbierta ? `Confirmar Pedido • Bs ${total}` : "Tienda Cerrada"}
                  <Send size={16} />
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