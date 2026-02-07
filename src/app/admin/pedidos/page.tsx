import React from "react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Flower2, Calendar, Clock, ArrowDownUp, ListFilter } from "lucide-react";
import AdminPedidosRealtime from "@/components/AdminPedidosRealtime";
import { BotoneraAdmin } from "@/components/BotoneraAdmin";

export const dynamic = 'force-dynamic';

const COUNTRIES = [
  { code: "BO", name: "Bolivia", prefix: "+591", flag: "https://flagcdn.com/bo.svg", limit: 8 },
  { code: "AR", name: "Argentina", prefix: "+54", flag: "https://flagcdn.com/ar.svg", limit: 10 },
  { code: "CL", name: "Chile", prefix: "+56", flag: "https://flagcdn.com/cl.svg", limit: 9 },
  { code: "PE", name: "Perú", prefix: "+51", flag: "https://flagcdn.com/pe.svg", limit: 9 },
  { code: "CO", name: "Colombia", prefix: "+57", flag: "https://flagcdn.com/co.svg", limit: 10 },
  { code: "MX", name: "México", prefix: "+52", flag: "https://flagcdn.com/mx.svg", limit: 10 },
  { code: "ES", name: "España", prefix: "+34", flag: "https://flagcdn.com/es.svg", limit: 9 },
  { code: "US", name: "Estados Unidos", prefix: "+1", flag: "https://flagcdn.com/us.svg", limit: 10 },
  { code: "BR", name: "Brasil", prefix: "+55", flag: "https://flagcdn.com/br.svg", limit: 11 },
  { code: "UY", name: "Uruguay", prefix: "+598", flag: "https://flagcdn.com/uy.svg", limit: 8 },
  { code: "PY", name: "Paraguay", prefix: "+595", flag: "https://flagcdn.com/py.svg", limit: 9 },
  { code: "EC", name: "Ecuador", prefix: "+593", flag: "https://flagcdn.com/ec.svg", limit: 9 },
  { code: "VE", name: "Venezuela", prefix: "+58", flag: "https://flagcdn.com/ve.svg", limit: 10 },
  { code: "PA", name: "Panamá", prefix: "+507", flag: "https://flagcdn.com/pa.svg", limit: 8 },
  { code: "CR", name: "Costa Rica", prefix: "+506", flag: "https://flagcdn.com/cr.svg", limit: 8 },
  { code: "DO", name: "Rep. Dominicana", prefix: "+1", flag: "https://flagcdn.com/do.svg", limit: 10 },
  { code: "GT", name: "Guatemala", prefix: "+502", flag: "https://flagcdn.com/gt.svg", limit: 8 },
  { code: "HN", name: "Honduras", prefix: "+504", flag: "https://flagcdn.com/hn.svg", limit: 8 },
  { code: "SV", name: "El Salvador", prefix: "+503", flag: "https://flagcdn.com/sv.svg", limit: 8 },
  { code: "NI", name: "Nicaragua", prefix: "+505", flag: "https://flagcdn.com/ni.svg", limit: 8 },
  { code: "PR", name: "Puerto Rico", prefix: "+1", flag: "https://flagcdn.com/pr.svg", limit: 10 },
  { code: "IT", name: "Italia", prefix: "+39", flag: "https://flagcdn.com/it.svg", limit: 10 },
  { code: "FR", name: "Francia", prefix: "+33", flag: "https://flagcdn.com/fr.svg", limit: 9 },
  { code: "DE", name: "Alemania", prefix: "+49", flag: "https://flagcdn.com/de.svg", limit: 11 },
  { code: "GB", name: "Reino Unido", prefix: "+44", flag: "https://flagcdn.com/gb.svg", limit: 10 },
  { code: "CA", name: "Canadá", prefix: "+1", flag: "https://flagcdn.com/ca.svg", limit: 10 },
  { code: "PT", name: "Portugal", prefix: "+351", flag: "https://flagcdn.com/pt.svg", limit: 9 },
].sort((a, b) => a.name.localeCompare(b.name));

// Función para forzar la visualización en hora de Bolivia (UTC-4)
function toBoliviaTime(date: Date) {
  const boliviaOffset = 4 * 60 * 60 * 1000;
  const serverOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - boliviaOffset + serverOffset);
}

export default async function AdminPedidosPage({ 
  searchParams 
}: { 
  searchParams: { filter?: string, sort?: string, view?: string, notify?: string, tel?: string } 
}) {
  const filter = searchParams.filter || 'all';
  const sort = searchParams.sort || 'recent';
  const notifyId = searchParams.notify;
  const telefonoCliente = searchParams.tel;

  // Lógica para filtrar por fecha (Hoy en Bolivia)
  let whereClause: any = {};
  
  if (filter === 'today') {
    const now = new Date();
    // Obtener fecha actual en zona horaria de Bolivia
    const boliviaTimeStr = now.toLocaleString("en-US", { timeZone: "America/La_Paz" });
    const boliviaDate = new Date(boliviaTimeStr);
    
    const yyyy = boliviaDate.getFullYear();
    const mm = String(boliviaDate.getMonth() + 1).padStart(2, '0');
    const dd = String(boliviaDate.getDate()).padStart(2, '0');
    
    // Construir rango UTC correspondiente al día en Bolivia (UTC-4)
    const startIso = `${yyyy}-${mm}-${dd}T00:00:00.000-04:00`;
    const endIso = `${yyyy}-${mm}-${dd}T23:59:59.999-04:00`;
    
    whereClause.fecha_entrega = {
      gte: new Date(startIso),
      lte: new Date(endIso)
    };
  }

  // Lógica de ordenamiento
  let orderByClause: any = { fecha_pedido: 'desc' };
  
  if (sort === 'delivery_asc') {
    orderByClause = { fecha_entrega: 'asc' };
  } else if (sort === 'delivery_desc') {
    orderByClause = { fecha_entrega: 'desc' };
  } else if (sort === 'recent') {
    orderByClause = { fecha_pedido: 'desc' };
  }

  const rawPedidos = await prisma.pedidos.findMany({
    where: whereClause,
    orderBy: orderByClause,
    include: {
      detalle_pedidos: {
        include: {
          ramos: true,
          flores: true
        },
      }
    }
  });

  // Serializamos para evitar errores con BigInt al pasar datos a componentes cliente
  const pedidos = JSON.parse(JSON.stringify(rawPedidos, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 px-4 md:px-0">
      <AdminPedidosRealtime />

      {/* RENDERIZADO DEL NUEVO MODAL ESTILO FLORERÍA */}
      {notifyId && telefonoCliente && (
        <ModalConfirmacionWhatsApp id={notifyId} telefono={telefonoCliente} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif italic text-gray-800">Panel de Pedidos</h2>
          <p className="text-sm text-gray-500">Gestión simplificada de pedidos.</p>
        </div>
        
        {/* Barra de Herramientas de Filtro y Orden */}
        <div className="flex flex-wrap gap-3">
          {/* Filtro de Fecha */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <Link 
              href={`?filter=all&sort=${sort}`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ListFilter size={14} /> Todos
            </Link>
            <Link 
              href={`?filter=today&sort=${sort}`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'today' ? 'bg-[#C5A059] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Calendar size={14} /> Para Hoy
            </Link>
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <Link 
              href={`?filter=${filter}&sort=recent`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sort === 'recent' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ArrowDownUp size={14} /> Recientes
            </Link>
            <Link 
              href={`?filter=${filter}&sort=delivery_asc`} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sort === 'delivery_asc' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Clock size={14} /> Próxima Entrega
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido:any) => {
          const country = COUNTRIES.find(c => pedido.telefono_contacto?.startsWith(c.prefix));
          const displayPhone = country ? `${country.prefix} ${pedido.telefono_contacto?.slice(country.prefix.length)}` : pedido.telefono_contacto;

          return (
            <div key={pedido.id.toString()} className="group relative bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-all">
              
              {/* Enlace que cubre toda la tarjeta */}
              <Link href={`/admin/pedidos/${pedido.id}`} className="absolute inset-0 z-10 rounded-3xl" />

              {/* Header de la tarjeta */}
              <div className="flex justify-between items-start mb-4">
                <div className="hover:opacity-70 transition-opacity">
                  <h2 className="text-xl font-serif italic text-gray-800">Pedido #{pedido.id}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ver detalles →</p>
                </div>
              </div>

              {/* Botonera de Estado (Separada para evitar conflictos de click) */}
              <div className="mb-4 relative z-20">
                <BotoneraAdmin pedido={pedido} pedidoId={pedido.id.toString()} estadoActual={pedido.estado || ""} />
              </div>

              {/* Información del Cliente y Fecha */}
              <div className="space-y-3 flex-grow">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Solicitado:</p>
                  <p className="text-xs text-gray-700 font-medium">
                    {format(new Date(pedido.fecha_pedido), "dd/MM/yy - hh:mm aa", { locale: es })}
                  </p>
                </div>

                <div className="py-2 border-y border-gray-50">
                  <p className="text-base font-bold text-gray-800">{pedido.nombre_contacto}</p>
                  <div className="flex items-center gap-2">
                    {country && <img src={country.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                    <p className="text-xs text-gray-500 font-mono">{displayPhone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entrega:</p>
                  <div className="mt-1">
                    <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-md font-bold text-xs">
                      {format(toBoliviaTime(new Date(pedido.fecha_entrega)), "EEEE dd 'de' MMMM", { locale: es })}
                    </span>
                    <p className="text-[10px] text-amber-700 mt-1 ml-1">
                       {format(toBoliviaTime(new Date(pedido.fecha_entrega)), "hh:mm aa", { locale: es })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer de la tarjeta con Total y Pago */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-serif italic text-gray-500">Monto Total</span>
                  <span className="text-lg font-bold text-gray-900">Bs {Number(pedido.total_pagar).toFixed(2)}</span>
                </div>
              </div>
            </div>
        )})}

        {pedidos.length === 0 && (
          <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Flower2 className="text-gray-200" size={40} />
            </div>
              <p className="text-gray-400 font-serif italic text-xl">No se encontraron pedidos con estos filtros.</p>
              {(filter !== 'all' || sort !== 'recent') && (
                <Link href="?filter=all&sort=recent" className="inline-block mt-4 text-xs font-bold text-[#C5A059] uppercase tracking-widest hover:underline">
                  Limpiar filtros
                </Link>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalConfirmacionWhatsApp({ id, telefono }: { id: string, telefono: string }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Fondo desenfocado */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
      
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </div>
        
        <h3 className="text-2xl font-serif italic text-gray-800 mb-2">Pedido Aceptado</h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          El estado se actualizó correctamente. ¿Deseas notificar al cliente ahora por WhatsApp?
        </p>

        <div className="flex flex-col gap-3">
          <a 
            href={`https://wa.me/${telefono.replace(/\+/g, '').replace(/\s/g, '')}?text=Hola, tu pedido en Florería Flor de Loto ha sido aceptado y está en preparación.`}
            target="_blank"
            className="bg-[#C5A059] text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#b38f4d] transition-all shadow-lg active:scale-95"
          >
            Enviar Notificación
          </a>
          <Link 
            href="?" 
            className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-700 transition-colors"
          >
            Ahora no, gracias
          </Link>
        </div>
      </div>
    </div>
  );
}