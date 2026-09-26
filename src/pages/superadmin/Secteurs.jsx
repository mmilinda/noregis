import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Search, RefreshCw, CheckCircle2, Edit, AlertCircle, Building2, UserCheck, UserX } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, FormInput, Modal } from '../../components/UI';
import { secteurService } from '../../services/secteurService';
import { entrepriseService } from '../../services/entrepriseService';
import { TRANSLATIONS } from '../../translations';

const EMPTY_SECTEUR = {
  nom: '',
  description: '',
};

export default function SecteursManagement({ isMobile }) {
  const { state, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];
  const [secteurs, setSecteurs] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_SECTEUR);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_SECTEUR);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSec, resEnt] = await Promise.all([
        secteurService.getAll(),
        entrepriseService.getAll().catch(() => ({ entreprises: [] })),
      ]);
      setSecteurs(resSec.secteurs || []);
      setEntreprises(resEnt.entreprises || []);
    } catch {
      notify('error', 'Erreur lors du chargement des secteurs d\'activité.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute number of companies per sector
  const getCompanyCount = (sectorName) => {
    if (!sectorName) return 0;
    const lowerName = sectorName.toLowerCase().trim();
    return entreprises.filter(e => (e.secteur || '').toLowerCase().trim() === lowerName).length;
  };

  const { searchQuery } = state;
  const filtered = secteurs.filter(sec => {
    const matchStatut = statutFilter === 'ALL' || (sec.statut || 'ACTIF') === statutFilter;
    const q = (searchTerm || searchQuery || '').toLowerCase().trim();
    const matchQuery = !q || sec.nom?.toLowerCase().includes(q) || sec.code?.toLowerCase().includes(q) || sec.description?.toLowerCase().includes(q);
    return matchStatut && matchQuery;
  });

  // Handlers
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.nom.trim()) {
      notify('error', 'Le nom du secteur est obligatoire.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await secteurService.create({
        nom: createForm.nom.trim(),
        description: createForm.description.trim(),
      });

      if (res.success) {
        notify('success', `Secteur "${createForm.nom}" créé avec succès !`);
        setCreateForm(EMPTY_SECTEUR);
        setIsCreateOpen(false);
        await loadData();
      } else {
        notify('error', res.message || 'Échec de la création du secteur.');
      }
    } catch {
      notify('error', 'Erreur réseau lors de la création.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditOpen = (sec) => {
    setEditTarget(sec);
    setEditForm({
      nom: sec.nom || '',
      description: sec.description || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.nom.trim()) {
      notify('error', 'Le nom du secteur est obligatoire.');
      return;
    }

    setEditSubmitting(true);
    const secId = editTarget.id || editTarget._id;
    try {
      const res = await secteurService.update(secId, {
        nom: editForm.nom.trim(),
        description: editForm.description.trim(),
      });

      if (res.success) {
        notify('success', 'Secteur mis à jour avec succès !');
        setIsEditOpen(false);
        setEditTarget(null);
        await loadData();
      } else {
        notify('error', res.message || 'Échec de la modification.');
      }
    } catch {
      notify('error', 'Erreur lors de la mise à jour du secteur.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleStatusChange = async (secId, newStatut) => {
    try {
      const res = await secteurService.changeStatus(secId, newStatut);
      if (res.success) {
        const actionText = newStatut === 'ACTIF' ? 'activé' : 'suspendu';
        notify('success', `Le secteur d'activité a été ${actionText}.`);
        await loadData();
      } else {
        notify('error', res.message || 'Impossible de modifier le statut.');
      }
    } catch {
      notify('error', 'Erreur lors du changement de statut.');
    }
  };

  const totalSecteurs = secteurs.length;
  const secteursActifs = secteurs.filter(s => s.statut === 'ACTIF').length;
  const secteursSuspendus = secteurs.filter(s => s.statut === 'SUSPENDU').length;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
              SuperAdmin Supervision
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Gestion des Secteurs d'Activité
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Créez, modifiez et suspendez les secteurs d'activité rattachés aux entreprises partenaires.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Btn
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            title="Rafraîchir les données"
          />
          <Btn
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsCreateOpen(true)}
          >
            Créer un Secteur
          </Btn>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Secteurs</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalSecteurs}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Secteurs Actifs</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{secteursActifs}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Secteurs Suspendus</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{secteursSuspendus}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Entreprises Couvertes</p>
          <p className="text-2xl font-black text-brand-blue-bright mt-1">{entreprises.length}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader
          title={`Secteurs Registrés (${filtered.length})`}
          subtitle="Consultez et contrôlez la disponibilité des secteurs d'activité"
        />

        {/* Filters bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.search_secteur || "Rechercher un secteur d'activité (Nom, code...)"}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-brand-blue-bright transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIF">Actifs</option>
              <option value="SUSPENDU">Suspendus</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="p-3 sm:p-4 overflow-hidden w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                <th className="py-2.5 px-3 w-[28%]">Code & Nom du Secteur</th>
                <th className="py-2.5 px-2 w-[32%]">Description</th>
                <th className="py-2.5 px-2 w-[16%]">Boîtes Rattachées</th>
                <th className="py-2.5 px-2 w-[12%]">Statut</th>
                <th className="py-2.5 px-3 w-[12%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-bold">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    Chargement des secteurs d'activité...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-bold">
                    Aucun secteur d'activité trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map(sec => {
                  const secId = sec.id || sec._id;
                  const isActif = sec.statut === 'ACTIF';
                  const count = getCompanyCount(sec.nom);

                  return (
                    <tr key={secId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-black shrink-0">
                            <Briefcase size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900 dark:text-white text-xs truncate leading-tight">{sec.nom}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{sec.code || secId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 text-xs min-w-0 overflow-hidden">
                        <p className="truncate font-medium">{sec.description || 'Aucune description'}</p>
                      </td>
                      <td className="py-2.5 px-2 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5 text-xs text-brand-blue-bright font-black">
                          <Building2 size={13} className="shrink-0" />
                          <span className="truncate">{count} entreprise{count > 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 min-w-0 overflow-hidden">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block truncate max-w-full ${
                          isActif ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {sec.statut || 'ACTIF'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right min-w-0 overflow-hidden">
                        <div className="flex justify-end items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditOpen(sec)}
                            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all shrink-0"
                            title="Modifier le secteur"
                          >
                            <Edit size={13} />
                          </button>

                          {isActif ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(secId, 'SUSPENDU')}
                              className="p-1.5 rounded-lg text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
                              title="Suspendre le secteur d'activité"
                            >
                              <AlertCircle size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(secId, 'ACTIF')}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all shrink-0"
                              title="Activer le secteur d'activité"
                            >
                              <UserCheck size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Création Secteur */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Créer un Secteur d'Activité"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <FormInput
            label="Nom du Secteur *"
            id="create_sec_nom"
            placeholder="Ex: Transport, BTP, Agroalimentaire..."
            value={createForm.nom}
            onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))}
            required
          />

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Description / Périmètre
            </label>
            <textarea
              rows={3}
              placeholder="Description des activités couvertes par ce secteur..."
              value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-brand-blue-bright transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Annuler
            </Btn>
            <Btn
              type="submit"
              variant="primary"
              size="sm"
              loading={createSubmitting}
              icon={Plus}
            >
              Créer le Secteur
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal Edition Secteur */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modifier le Secteur d'Activité"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <FormInput
            label="Nom du Secteur *"
            id="edit_sec_nom"
            value={editForm.nom}
            onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
            required
          />

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Description / Périmètre
            </label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-brand-blue-bright transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Annuler
            </Btn>
            <Btn
              type="submit"
              variant="primary"
              size="sm"
              loading={editSubmitting}
              icon={CheckCircle2}
            >
              Enregistrer les Modifications
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
