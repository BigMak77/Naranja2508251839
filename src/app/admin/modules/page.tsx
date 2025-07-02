'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Module {
  id: string
  name: string
  description: string
  version: number
  is_archived: boolean
  created_at: string
}

export default function ModuleListPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [filtered, setFiltered] = useState<Module[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Failed to load modules')
        console.error(error)
      } else {
        setModules(data as Module[])
      }
      setLoading(false)
    }

    fetchModules()
  }, [])

  useEffect(() => {
    const result = modules
      .filter((m) =>
        filter === 'all' ? true :
        filter === 'active' ? !m.is_archived :
        m.is_archived
      )
      .sort((a, b) => Number(a.is_archived) - Number(b.is_archived))

    setFiltered(result)
    setCurrentPage(1) // Reset page on filter change
  }, [modules, filter])

  const archiveModule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return

    setArchivingId(id)
    const { error } = await supabase
      .from('modules')
      .update({ is_archived: true })
      .eq('id', id)

    if (!error) {
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_archived: true } : m))
      )
      setMessage(`✅ "${name}" archived successfully.`)
      setTimeout(() => setMessage(''), 3000)
    } else {
      alert('Failed to archive module')
    }
    setArchivingId(null)
  }

  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(filtered.length / itemsPerPage)
  const displayed = itemsPerPage === 0 ? filtered : filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="w-full px-6 py-10 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-orange-600">📦 Modules</h1>
        <Link
          href="/admin/modules/add"
          className="bg-orange-600 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-orange-700 transition text-sm"
        >
          ➕ Add Module
        </Link>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(['all', 'active', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1 rounded-full text-sm font-medium border ${
              filter === f
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-50'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Archived'}
          </button>
        ))}
      </div>

      {/* Items Per Page */}
      <div className="mb-4 text-sm">
        <label className="mr-2 font-medium">Show:</label>
        {[25, 50, 100, 0].map((n) => (
          <button
            key={n}
            onClick={() => {
              setItemsPerPage(n)
              setCurrentPage(1)
            }}
            className={`px-3 py-1 border rounded mr-2 ${
              itemsPerPage === n
                ? 'bg-teal-800 text-white'
                : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-50'
            }`}
          >
            {n === 0 ? 'All' : n}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="mb-4 bg-green-100 text-green-800 px-4 py-2 rounded border border-green-300">
          {message}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p>Loading modules...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 italic">No modules found.</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-teal-200 shadow">
          <table className="w-full text-sm bg-white">
            <thead className="bg-teal-800 text-white text-left">
              <tr>
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Description</th>
                <th className="p-3 border-b">Version</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((mod) => (
                <tr key={mod.id} className="hover:bg-orange-50">
                  <td className="p-3 border-b font-medium">{mod.name}</td>
                  <td className="p-3 border-b">{mod.description || '—'}</td>
                  <td className="p-3 border-b">{mod.version}</td>
                  <td className="p-3 border-b">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      mod.is_archived
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {mod.is_archived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  <td className="p-3 border-b space-x-2 whitespace-nowrap">
                    <Link
                      href={`/admin/modules/${mod.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/modules/${mod.id}/edit`}
                      className="text-green-600 hover:underline"
                    >
                      Edit
                    </Link>
                    {!mod.is_archived && (
                      <button
                        onClick={() => archiveModule(mod.id, mod.name)}
                        disabled={archivingId === mod.id}
                        className="text-red-600 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {archivingId === mod.id ? 'Archiving...' : 'Archive'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {itemsPerPage !== 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center text-sm">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-1 border rounded bg-white text-teal-800 hover:bg-teal-50 disabled:opacity-50"
          >
            ← Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-1 border rounded bg-white text-teal-800 hover:bg-teal-50 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
