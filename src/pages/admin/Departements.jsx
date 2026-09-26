import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree, Plus, Search, CheckCircle, XCircle,
  Edit3, Trash2, Building2, RefreshCw, AlertCircle, Shield
} from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { departementService } from '../../services/departementService';
import { FormInput, FormSelect, Btn, Modal } from '../../components/UI';

export default function DepartementsManagement() {
  const { state, notify } = useApp();
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Creation / Edition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartement, setEditingDepartement] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    nom: '',
    code: '',
    description: '',
    statut: 'ACTIF',
  });
  const [formErrors, setFormErrors] = useState({});

  // Confirm Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currentUser = state.agent || state.user || {};
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SUPERADMIN';

  // Chargement des départements
  const loadDepartements = async () => {
    setLoading(true);
    try {
      const res = await departementService.getAll();
      if (res && res.departements) {
        setDepartements(res.departements);
      }
    } catch (err) {
      console.error('Erreur chargement départements :', err);
      notify('error', err.message || 'Impossible de charger la liste des départements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartements();
  }, []);

  // Ouvre la modal en mode création
  const handleOpenCreate = () => {
    setEditingDepartement(null);
    setForm({
      nom: '',
      code: '',
      description: '',
      statut: 'ACTIF',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Ouvre la modal en mode édition
  const handleOpenEdit = (dept) => {
    setEditingDepartement(dept);
    setForm({
      nom: dept.nom || '',
      code: dept.code || '',
      description: dept.description || '',
      statut: dept.statut || 'ACTIF',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Le nom du département est obligatoire.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Soumission Formulaire (Créer ou Modifier)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setModalLoading(true);
    try {
      if (editingDepartement) {
        const res = await departementService.update(editingDepartement._id || editingDepartement.id, form);
        notify('success', res.message || 'Département mis à jour avec succès.');
      } else {
        const res = await departementService.create(form);
        notify('success', res.message || 'Nouveau département créé avec succès.');
      }
      setIsModalOpen(false);
      loadDepartements();
    } catch (err) {
      notify('error', err.message || 'Erreur lors de la sauvegarde du département.');
    } finally {
      setModalLoading(false);
    }
  };

  // Action Supprimer
  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setDeleteLoading(true);
    try {
      const id = deptToDelete._id || deptToDelete.id;
      const res = await departementService.delete(id);
      notify('success', res.message || 'Département supprimé avec succès.');
      setDeleteModalOpen(false);
      setDeptToDelete(null);
      loadDepartements();
    } catch (err) {
      notify('error', err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtrage par recherche
  const filteredDepartements = useMemo(() => {
    const q = (searchTerm || state.searchQuery || '').toLowerCase().trim();
    if (!q) return departements;
    return departements.filter(d => 
      (d.nom && d.nom.toLowerCase().includes(q)) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  }, [departements, searchTerm, state.searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const total = departements.length;
    const actifs = departements.filter(d => d.statut === 'ACTIF').length;
    const desactives = total - actifs;
    return { total, actifs, desactives };
  }, [departements]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue-bright to-blue-600 flex items-center justify-center text-white shadow-lg shadow-brand-blue-bright/20 shrink-0">
            <FolderTree size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestion des Départements & Services
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Créez et configurez les services internes de votre entreprise pour l'accueil et le suivi des visites.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Btn
            variant="secondary"
            icon={RefreshCw}
            onClick={loadDepartements}
            disabled={loading}
            className="shrink-0"
          >
            Actualiser
          </Btn>
          <Btn
            variant="primary"
            icon={Plus}
            onClick={handleOpenCreate}
            className="shrink-0 shadow-lg shadow-brand-blue-bright/20"
          >
            Nouveau Département
          </Btn>
        </div>
      </div>

      {/* Cartes de Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Départements</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brand-blue-bright flex items-center justify-center font-bold">
            <FolderTree size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-emerald-500 tracking-wider">Services Actifs</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.actifs}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-rose-500 tracking-wider">Désactivés</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.desactives}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Barre de Recherche Locale */}
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Filtrer un département par nom, code ou description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white px-2 py-1"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Table & Grille des départements */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <RefreshCw size={28} className="animate-spin mx-auto text-brand-blue-bright" />
            <p className="text-sm font-bold">Chargement de vos départements...</p>
          </div>
        ) : filteredDepartements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <FolderTree size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">Aucun département trouvé</p>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'Aucun résultat ne correspond à votre recherche.' : 'Cliquez sur "Nouveau Département" pour en ajouter un.'}
            </p>
            {!searchTerm && (
              <Btn variant="primary" icon={Plus} onClick={handleOpenCreate} className="mt-2 inline-flex">
                Créer un Département
              </Btn>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/5 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="p-4 pl-6">Nom du Département</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm font-bold">
                {filteredDepartements.map((dept) => (
                  <tr
                    key={dept._id || dept.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-blue-bright/10 text-brand-blue-bright font-black text-xs flex items-center justify-center shrink-0">
                          {dept.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white group-hover:text-brand-blue-bright transition-colors">
                            {dept.nom}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {dept.code ? (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono text-xs font-black rounded-md">
                          {dept.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 max-w-md">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {dept.description || 'Aucune description'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        dept.statut === 'ACTIF'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.statut === 'ACTIF' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {dept.statut}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="p-2 text-slate-400 hover:text-brand-blue-bright hover:bg-brand-blue-bright/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setDeptToDelete(dept);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création / Edition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartement ? 'Modifier le Département' : 'Nouveau Département / Service'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nom du Département"
            id="nom"
            required
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            error={formErrors.nom}
            placeholder="Ex: Direction Générale, Ressources Humaines..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Code Identifiant (Optionnel)"
              id="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Ex: RH, DSI, LOG..."
              className="uppercase font-mono"
            />

            <FormSelect
              label="Statut"
              id="statut"
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
              options={[
                { value: 'ACTIF', label: 'Actif' },
                { value: 'DESACTIVE', label: 'Désactivé' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optionnel)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description synthétique des activités de ce service..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-brand-blue-bright transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <Btn variant="secondary" onClick={() => setIsModalOpen(false)} fullWidth type="button">
              Annuler
            </Btn>
            <Btn variant="primary" type="submit" fullWidth loading={modalLoading}>
              {editingDepartement ? 'Enregistrer les modifications' : 'Créer le département'}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Voulez-vous supprimer ce département ?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Êtes-vous sûr de vouloir supprimer <strong className="text-slate-900 dark:text-white">{deptToDelete?.nom}</strong> ? Cette action est irréversible.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setDeleteModalOpen(false)} fullWidth type="button">
              Annuler
            </Btn>
            <Btn variant="danger" onClick={handleConfirmDelete} fullWidth loading={deleteLoading}>
              Supprimer
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
