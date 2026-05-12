'use client'
import { useState } from 'react'
import Swal from 'sweetalert2'
import { createProduct } from '@/features/admin/createProduct'
import { useCategories } from '@/hooks/useCategories'
import { useBrands } from '@/hooks/useBrands'
import { PRODUCTS_QUERY_KEY } from '@/hooks/useProducts'
import { useQueryClient } from '@tanstack/react-query'
import { ProductTypes } from '@/types/database'
import Select from 'react-select'

export default function FormProducto() {
  const [loading, setLoading] = useState(false)
  const { data: categories = [] } = useCategories()
  const { data: brands = [] } = useBrands()
  const queryClient = useQueryClient()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [form, setForm] = useState({
    // Campos del Producto Base
    name: '',
    brand_id: '',
    description: '',
    notes_top: '',
    notes_middle: '',
    notes_base: '',
    gender: 'unisex',
    concentration: 'EDP',
    is_active: true,
    // Campos de la Variante Inicial
    sku: '',
    price: '',
    stock: '',
    size_ml: '',
    product_type: 'full_size' as ProductTypes,
    is_on_offer: false,
    offer_price: '',
  })

  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!file) {
      Swal.fire({ icon: 'warning', title: 'Imagen Requerida', text: 'Selecciona una imagen' })
      return
    }

    try {
      setLoading(true)

      // El backend debe manejar la creación de producto + variante inicial
      await createProduct({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        size_ml: Number(form.size_ml),
        offer_price: Number(form.offer_price) || null,
        product_type: form.product_type as ProductTypes,
        category_ids: selectedCategories,
        file
      })
      
      // Invalidate products cache so lists update immediately
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      Swal.fire({ icon: 'success', title: '¡Creado!', text: 'Producto y variante creados exitosamente' })
      
      // Reset completo
      setForm({
        name: '', brand_id: '', description: '', notes_top: '', notes_middle: '', notes_base: '',
        gender: 'unisex', concentration: 'EDP', is_active: true, sku: '', price: '',
        stock: '', size_ml: '', product_type: 'full_size', is_on_offer: false, offer_price: '',
      })
      setSelectedCategories([])
      setFile(null)

    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const customStyles = {
    control: (base: any, state: { isFocused: boolean }) => ({
      ...base,
      backgroundColor: "#1a1a1a",
      borderColor: state.isFocused ? "#c9a96e" : "rgba(201,169,110,0.3)",
      color: "#ececec",
    }),
    menu: (base: any) => ({ ...base, backgroundColor: "#1a1a1a", border: "1px solid rgba(201,169,110,0.3)" }),
    option: (base: any, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected ? "#c9a96e" : state.isFocused ? "#2a2a2a" : "#1a1a1a",
      color: state.isSelected ? "#000" : "#ececec",
    }),
    singleValue: (base: any) => ({ ...base, color: "#ececec" }),
    multiValue: (base: any) => ({ ...base, backgroundColor: "#c9a96e", color: "#000" }),
  };

  return (
    <div className="max-w-4xl mx-auto bg-black rounded-2xl border border-[#c9a96e]/30 p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[#ececec]">Nuevo Producto de Producción</h2>
        <p className="text-[#a5a5a5]">Define el perfume y su primera variante comercial</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECCIÓN 1: PRODUCTO BASE */}
        <div className="space-y-4">
          <h3 className="text-[#c9a96e] font-bold border-b border-[#c9a96e]/20 pb-2">Información del Perfume</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field-custom" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Marca</label>
              <Select instanceId="brand-select" styles={customStyles} options={brands.map(b => ({ value: b.id, label: b.name }))} onChange={(val: any) => setForm({...form, brand_id: val.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Género</label>
              <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="input-field-custom">
                <option value="masculine">Masculino</option>
                <option value="feminine">Femenino</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Concentración</label>
              <select value={form.concentration} onChange={(e) => setForm({...form, concentration: e.target.value})} className="input-field-custom">
                <option value="EDT">EDT</option>
                <option value="EDP">EDP</option>
                <option value="Parfum">Parfum</option>
                <option value="Cologne">Cologne</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Categorías</label>
              <Select instanceId="category-select" isMulti styles={customStyles} options={categories.map(c => ({ value: c.id, label: c.name }))} onChange={(vals: any) => setSelectedCategories(vals.map((v: any) => v.value))} />
            </div>
          </div>

          {/* NOTAS OLFATIVAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Notas de Salida" value={form.notes_top} onChange={(e) => setForm({...form, notes_top: e.target.value})} className="input-field-custom" />
            <input placeholder="Notas de Corazón" value={form.notes_middle} onChange={(e) => setForm({...form, notes_middle: e.target.value})} className="input-field-custom" />
            <input placeholder="Notas de Fondo" value={form.notes_base} onChange={(e) => setForm({...form, notes_base: e.target.value})} className="input-field-custom" />
          </div>
          
          <textarea placeholder="Descripción general..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className="input-field-custom w-full resize-none" required />
        </div>

        {/* SECCIÓN 2: VARIANTE INICIAL */}
        <div className="space-y-4 bg-[#1a1a1a]/50 p-6 rounded-xl border border-[#c9a96e]/10">
          <h3 className="text-[#c9a96e] font-bold border-b border-[#c9a96e]/20 pb-2">Variante Comercial (Stock y Precio)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">SKU (Único)</label>
              <input type="text" placeholder="CH-BLEU-100" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="input-field-custom" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Precio Base</label>
              <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="input-field-custom" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} className="input-field-custom" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">Tamaño (ml)</label>
              <input type="number" value={form.size_ml} onChange={(e) => setForm({...form, size_ml: e.target.value})} className="input-field-custom" required />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <select value={form.product_type} onChange={(e) => setForm({...form, product_type: e.target.value as ProductTypes})} className="input-field-custom">
              <option value="full_size">Full Size</option>
              <option value="decant">Decant</option>
            </select>
            
            <label className="flex items-center gap-2 text-[#ececec] cursor-pointer">
              <input type="checkbox" checked={form.is_on_offer} onChange={(e) => setForm({...form, is_on_offer: e.target.checked})} className="accent-[#c9a96e]" />
              ¿En Oferta?
            </label>

            {form.is_on_offer && (
              <input type="number" placeholder="Precio Oferta" value={form.offer_price} onChange={(e) => setForm({...form, offer_price: e.target.value})} className="input-field-custom w-40" required />
            )}
          </div>
        </div>

        {/* IMAGEN */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#c9a96e] uppercase">Imagen Principal</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-[#a5a5a5] file:bg-[#c9a96e] file:border-0 file:px-4 file:py-2 file:rounded-lg file:mr-4 file:cursor-pointer" required />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#c9a96e] text-black font-black py-4 rounded-lg uppercase hover:bg-[#b8a060] transition-colors disabled:opacity-50">
          {loading ? "Registrando en Base de Datos..." : "Crear Producto de Producción"}
        </button>
      </form>

      <style jsx>{`
        .input-field-custom {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #1a1a1a;
          border: 1px solid rgba(201, 169, 110, 0.3);
          border-radius: 0.5rem;
          color: #ececec;
          transition: all 0.2s;
        }
        .input-field-custom:focus {
          border-color: #c9a96e;
          outline: none;
          box-shadow: 0 0 0 1px #c9a96e;
        }
      `}</style>
    </div>
  );
}