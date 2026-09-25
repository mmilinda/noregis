import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Phone, Mail, MapPin, Briefcase, RefreshCw, CheckCircle2, Edit, History } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, FormInput, FormSelect, Modal } from '../../components/UI';
import { entrepriseService } from '../../services/entrepriseService';
import { secteurService } from '../../services/secteurService';
import { TRANSLATIONS } from '../../translations';

const EMPTY_ENTREPRISE = {
  nom: '',
  immatriculation: '',
  adresse: '',
  email: '',
  telephone: '',
  secteur: 'Maritime / Logistique',
  statut: 'ACTIF',
};

export default function EntreprisesManagement({ isMobile }) {
  const { state, notify } = useApp();
  const navigate = useNavigate();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const [entreprises, setEntreprises] = useState([]);
  const [secteursOptions, setSecteursOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('ALL');

  // Modal création
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_ENTREPRISE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal édition
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchEntreprises = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [data, secRes] = await Promise.all([
        entrepriseService.getAll(),
        secteurService.getAll().catch(() => ({ secteurs: [] })),
      ]);
      setEntreprises(Array.isArray(data) ? data : (data?.entreprises || []));
      
      const activeSecteurs = (secRes?.secteurs || [])
        .filter(s => s.statut === 'ACTIF')
        .map(s => s.nom);
      
      const defaultSecteurs = ['Maritime / Logistique', 'Énergie', 'Télécommunications', 'Banque / Finance', 'Santé', 'Administration Publique', 'Industrie', 'Autre'];
      const combined = Array.from(new Set([...activeSecteurs, ...defaultSecteurs]));
      setSecteursOptions(combined);
    } catch (err) {
      notify('error', 'Erreur lors du chargement des entreprises.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.nom.trim()) {
      setCreateError('Le nom de l\'entreprise est obligatoire.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await entrepriseService.create({
        nom: createForm.nom,
        code: createForm.immatriculation || `ENT-${Date.now().toString().slice(-4)}`,
        immatriculation: createForm.immatriculation,
        adresse: createForm.adresse,
        telephone: createForm.telephone,
        emailContact: createForm.email,
        secteur: createForm.secteur,
        statut: createForm.statut,
      });
      notify('success', `Entreprise "${createForm.nom}" créée avec succès.`);
      setCreateForm(EMPTY_ENTREPRISE);
      setCreateOpen(false);
      fetchEntreprises(true);
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création de l\'entreprise.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditOpen = (ent) => {
    setEditForm({
      id: ent.id || ent._id,
      nom: ent.nom || '',
      immatriculation: ent.immatriculation || ent.code || '',
      adresse: ent.adresse || '',
      email: ent.email || ent.emailContact || '',
      telephone: ent.telephone || '',
      secteur: ent.secteur || 'Maritime / Logistique',
      statut: ent.statut || 'ACTIF',
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.nom.trim()) {
      setEditError('Le nom de l\'entreprise est obligatoire.');
      return;
    }

    setEditing(true);
    setEditError('');

    try {
      await entrepriseService.update(editForm.id, {
        nom: editForm.nom,
        immatriculation: editForm.immatriculation,
        code: editForm.immatriculation,
        adresse: editForm.adresse,
        telephone: editForm.telephone,
        emailContact: editForm.email,
        secteur: editForm.secteur,
      });
      notify('success', `Entreprise "${editForm.nom}" mise à jour.`);
      setEditOpen(false);
      fetchEntreprises(true);
    } catch (err) {
      setEditError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setEditing(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    try {
      await entrepriseService.changeStatus(id, nextStatus);
      notify('success', `Statut entreprise mis à jour (${nextStatus}).`);
      fetchEntreprises(true);
    } catch (err) {
      notify('error', 'Erreur lors du changement de statut : ' + err.message);
    }
  };

  const handleViewHistory = (entId) => {
    navigate(`/history?entrepriseId=${entId}`);
  };

  const filtered = entreprises.filter(ent => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [ent.nom, ent.email, ent.emailContact, ent.telephone, ent.immatriculation, ent.code, ent.secteur]
      .filter(Boolean)
      .some(f => String(f).toLowerCase().includes(q));
    const matchStatut = filterStatut === 'ALL' || ent.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Building2 className="text-brand-blue-bright" size={32} />
            Gestion des Entreprises & Boîtes
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Création, modification, suspension et consultation de l'historique des structures rattachées.
          </p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setCreateOpen(true)} className="!rounded-xl">
          Créer une Entreprise
        </Btn>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`Entreprises (${filtered.length})`}
          subtitle="Liste globale des structures inscrites"
          actions={
            <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchEntreprises(true)} loading={loading} className="text-[10px] font-black uppercase">
              Actualiser
            </Btn>
          }
        />

        {/* Filters */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une entreprise (Nom, NINEA, email...)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-brand-blue-bright/20 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none"
            />
          </div>

          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIF">Actives</option>
            <option value="SUSPENDU">Suspendues</option>
          </select>
        </div>

        {/* Table */}
        <div className="p-3 sm:p-4 overflow-hidden w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                <th className="py-2.5 px-3 w-[28%]">Entreprise</th>
                <th className="py-2.5 px-2 w-[16%]">Code / NINEA</th>
                <th className="py-2.5 px-2 w-[16%]">Secteur</th>
                <th className="py-2.5 px-2 w-[20%]">Contact</th>
                <th className="py-2.5 px-2 w-[10%]">Statut</th>
                <th className="py-2.5 px-3 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {filtered.map(ent => {
                const entId = ent.id || ent._id;
                const isActif = ent.statut === 'ACTIF';

                return (
                  <tr key={entId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue-bright/10 text-brand-blue-bright flex items-center justify-center font-black shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-900 dark:text-white text-xs truncate leading-tight">{ent.nom}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={9} className="shrink-0" /> <span className="truncate">{ent.adresse || '—'}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-300 text-xs min-w-0">
                      <p className="truncate font-bold">{ent.immatriculation || ent.code || '—'}</p>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 text-xs min-w-0">
                      <p className="truncate font-bold">{ent.secteur || 'Autre'}</p>
                    </td>
                    <td className="py-2.5 px-2 text-xs min-w-0">
                      <p className="text-slate-900 dark:text-white truncate font-bold">{ent.emailContact || ent.email || '—'}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{ent.telephone}</p>
                    </td>
                    <td className="py-2.5 px-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block truncate max-w-full ${
                        isActif ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {ent.statut || 'ACTIF'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right min-w-0">
                      <div className="flex justify-end items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleViewHistory(entId)}
                          className="p-1.5 rounded-lg text-brand-blue-bright bg-brand-blue-bright/10 hover:bg-brand-blue-bright/20 transition-all shrink-0"
                          title="Historique de l'entreprise"
                        >
                          <History size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditOpen(ent)}
                          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all shrink-0"
                          title="Modifier l'entreprise"
                        >
                          <Edit size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(entId, ent.statut || 'ACTIF')}
                          className={`p-1.5 rounded-lg text-white transition-all shrink-0 ${
                            isActif ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          title={isActif ? 'Suspendre l\'entreprise' : 'Activer l\'entreprise'}
                        >
                          {isActif ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-bold">
                    Aucune entreprise ne correspond aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Création Entreprise */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Créer une Nouvelle Entreprise" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
              {createError}
            </div>
          )}

          <FormInput
            label="Nom de l'Entreprise"
            id="nom"
            required
            value={createForm.nom}
            onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))}
            icon={Building2}
            placeholder="Ex: Port Autonome de Dakar"
          />

          <FormInput
            label="NINEA / Registre du Commerce / Code"
            id="immatriculation"
            value={createForm.immatriculation}
            onChange={e => setCreateForm(f => ({ ...f, immatriculation: e.target.value }))}
            icon={Briefcase}
            placeholder="Ex: SN-DKR-2025-B-1234"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Email Professionnel"
              id="email"
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              icon={Mail}
              placeholder="contact@entreprise.sn"
            />
            <FormInput
              label="Téléphone Contact"
              id="telephone"
              value={createForm.telephone}
              onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))}
              icon={Phone}
              placeholder="+221 33 800 00 00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Secteur d'Activité"
              id="secteur"
              value={createForm.secteur}
              onChange={e => setCreateForm(f => ({ ...f, secteur: e.target.value }))}
              options={secteursOptions.length > 0 ? secteursOptions : ['Maritime / Logistique', 'Énergie', 'Télécommunications', 'Banque / Finance', 'Santé', 'Administration Publique', 'Industrie', 'Autre']}
            />
            <FormSelect
              label="Statut Initial"
              id="statut"
              value={createForm.statut}
              onChange={e => setCreateForm(f => ({ ...f, statut: e.target.value }))}
              options={[{ value: 'ACTIF', label: 'Actif' }, { value: 'SUSPENDU', label: 'Suspendu' }]}
            />
          </div>

          <FormInput
            label="Adresse Siège Social"
            id="adresse"
            value={createForm.adresse}
            onChange={e => setCreateForm(f => ({ ...f, adresse: e.target.value }))}
            icon={MapPin}
            placeholder="Ville, Quartier, Rue..."
          />

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setCreateOpen(false)} fullWidth type="button">
              Annuler
            </Btn>
            <Btn variant="success" type="submit" loading={creating} icon={CheckCircle2} fullWidth>
              Valider & Créer
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal Modification Entreprise */}
      {editOpen && editForm && (
        <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Modifier l'Entreprise" size="md">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
                {editError}
              </div>
            )}

            <FormInput
              label="Nom de l'Entreprise"
              id="edit_nom"
              required
              value={editForm.nom}
              onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
              icon={Building2}
            />

            <FormInput
              label="NINEA / Registre du Commerce / Code"
              id="edit_immatriculation"
              value={editForm.immatriculation}
              onChange={e => setEditForm(f => ({ ...f, immatriculation: e.target.value }))}
              icon={Briefcase}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Email Contact"
                id="edit_email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                icon={Mail}
              />
              <FormInput
                label="Téléphone Contact"
                id="edit_telephone"
                value={editForm.telephone}
                onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))}
                icon={Phone}
              />
            </div>

            <FormSelect
              label="Secteur d'Activité"
              id="edit_secteur"
              value={editForm.secteur}
              onChange={e => setEditForm(f => ({ ...f, secteur: e.target.value }))}
              options={secteursOptions.length > 0 ? secteursOptions : ['Maritime / Logistique', 'Énergie', 'Télécommunications', 'Banque / Finance', 'Santé', 'Administration Publique', 'Industrie', 'Autre']}
            />

            <FormInput
              label="Adresse Siège Social"
              id="edit_adresse"
              value={editForm.adresse}
              onChange={e => setEditForm(f => ({ ...f, adresse: e.target.value }))}
              icon={MapPin}
            />

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Btn variant="secondary" onClick={() => setEditOpen(false)} fullWidth type="button">
                Annuler
              </Btn>
              <Btn variant="primary" type="submit" loading={editing} icon={CheckCircle2} fullWidth>
                Enregistrer les Modifications
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
